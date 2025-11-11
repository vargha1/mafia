import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { gameAPI } from '../services/api';
import ChatBox from '../components/ChatBox';
import PlayerList from '../components/PlayerList';
import VoiceChat from '../components/VoiceChat';
import GamePhase from '../components/GamePhase';

const GameRoom = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!socket || !connected) return;

    fetchGame();

    // Join the game room via socket
    socket.emit('joinRoom', { gameId: id });

    // Socket event listeners
    socket.on('playerJoined', ({ game: updatedGame }) => {
      setGame(updatedGame);
    });

    socket.on('playerLeft', () => {
      fetchGame();
    });

    socket.on('playerReadyChanged', () => {
      fetchGame();
    });

    socket.on('gameStarted', ({ game: updatedGame }) => {
      setGame(updatedGame);
    });

    socket.on('roleAssigned', ({ role }) => {
      setMyRole(role);
    });

    socket.on('phaseChanged', ({ phase, dayNumber }) => {
      setGame(prev => ({ ...prev, phase, day_number: dayNumber }));
    });

    socket.on('playerEliminated', () => {
      fetchGame();
    });

    socket.on('gameEnded', ({ winner, game: finalGame }) => {
      setGame(finalGame);
      alert(winner === 'mafia' ? t('mafiaWins') : t('citizensWin'));
    });

    return () => {
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('playerReadyChanged');
      socket.off('gameStarted');
      socket.off('roleAssigned');
      socket.off('phaseChanged');
      socket.off('playerEliminated');
      socket.off('gameEnded');
      socket.emit('leaveRoom', { gameId: id });
    };
  }, [socket, connected, id]);

  const fetchGame = async () => {
    try {
      const response = await gameAPI.getGame(id);
      setGame(response.data);
      
      // Check if current user is ready
      const myPlayer = response.data.players?.find(p => p.user_id === user.id);
      if (myPlayer) {
        setIsReady(myPlayer.is_ready);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch game:', error);
      setLoading(false);
    }
  };

  const handleToggleReady = () => {
    if (!socket) return;
    socket.emit('toggleReady', { gameId: id });
    setIsReady(!isReady);
  };

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('startGame', { gameId: id });
  };

  const handleLeaveGame = async () => {
    try {
      await gameAPI.leaveGame(id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to leave game:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <p className="text-white text-2xl" data-testid="loading-text">{t('loading')}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <p className="text-white text-2xl">{t('error')}</p>
      </div>
    );
  }

  const isCreator = game.created_by === user.id;
  const allPlayersReady = game.players?.every(p => p.is_ready) && game.players?.length >= 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-6" data-testid="game-room-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="room-name">
                {game.room_name}
              </h1>
              <div className="text-gray-300">
                <span data-testid="game-status">{t('status')}: {t(game.status)}</span>
                <span className="mx-2">|</span>
                <span data-testid="game-phase">{t('phases.' + game.phase)}</span>
                {game.status === 'in_progress' && (
                  <>
                    <span className="mx-2">|</span>
                    <span data-testid="day-number">{t('dayNumber', { number: game.day_number })}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handleLeaveGame}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition"
              data-testid="leave-room-button"
            >
              {t('leaveRoom')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Players and Controls */}
          <div className="space-y-6">
            <PlayerList 
              players={game.players || []} 
              currentUserId={user.id}
              gameStatus={game.status}
              myRole={myRole}
            />

            {/* Lobby Controls */}
            {game.status === 'waiting' && (
              <div className="bg-gray-800 rounded-lg shadow-2xl p-6" data-testid="lobby-controls">
                <button
                  onClick={handleToggleReady}
                  className={`w-full py-3 px-4 rounded font-semibold mb-3 transition ${
                    isReady
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  } text-white`}
                  data-testid="ready-button"
                >
                  {isReady ? t('ready') : t('notReady')}
                </button>

                {isCreator && (
                  <button
                    onClick={handleStartGame}
                    disabled={!allPlayersReady}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="start-game-button"
                  >
                    {t('startGame')}
                  </button>
                )}
              </div>
            )}

            {/* Role Display */}
            {myRole && game.status === 'in_progress' && (
              <div className="bg-gray-800 rounded-lg shadow-2xl p-6" data-testid="role-display">
                <h3 className="text-xl font-bold text-white mb-2">{t('yourRole')}</h3>
                <p className="text-2xl font-bold text-red-400" data-testid="my-role">
                  {t(`roles.${myRole}`)}
                </p>
              </div>
            )}

            {/* Voice Chat Controls */}
            {game.status === 'in_progress' && (
              <VoiceChat gameId={id} players={game.players || []} />
            )}
          </div>

          {/* Middle Column - Game Phase & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {game.status === 'in_progress' && (
              <GamePhase
                phase={game.phase}
                dayNumber={game.day_number}
                players={game.players || []}
                gameId={id}
                myRole={myRole}
                socket={socket}
              />
            )}

            {/* Chat */}
            <ChatBox gameId={id} username={user.username} socket={socket} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
