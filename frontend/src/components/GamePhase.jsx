import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const GamePhase = ({ phase, dayNumber, players, gameId, myRole, socket }) => {
  const { t } = useTranslation();
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const alivePlayers = players.filter(p => p.is_alive);

  const handleVote = () => {
    if (!selectedPlayer || !socket) return;
    socket.emit('vote', { gameId, targetPlayerId: selectedPlayer });
    alert(t('voteSubmitted'));
    setSelectedPlayer(null);
  };

  const handleEliminate = () => {
    if (!selectedPlayer || !socket) return;
    socket.emit('eliminatePlayer', { gameId, playerId: selectedPlayer });
    setSelectedPlayer(null);
  };

  const handleNextPhase = () => {
    if (!socket) return;
    socket.emit('nextPhase', { gameId });
  };

  const getPhaseInstructions = () => {
    switch (phase) {
      case 'night':
        if (myRole === 'mafia') {
          return t('mafiaChooseVictim');
        } else if (myRole === 'doctor') {
          return t('doctorChooseProtect');
        } else if (myRole === 'detective') {
          return t('detectiveChooseInvestigate');
        }
        return t('nightPhaseWait');
      
      case 'day':
        return t('dayPhaseDiscuss');
      
      case 'voting':
        return t('votingPhaseInstruction');
      
      default:
        return '';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6" data-testid="game-phase">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2" data-testid="phase-title">
          {t(`phases.${phase}`)} - {t('dayNumber', { number: dayNumber })}
        </h2>
        <p className="text-gray-300 text-lg" data-testid="phase-instructions">
          {getPhaseInstructions()}
        </p>
      </div>

      {/* Player selection for actions */}
      {(phase === 'voting' || (phase === 'night' && ['mafia', 'doctor', 'detective'].includes(myRole))) && (
        <div className="space-y-4" data-testid="player-selection">
          <h3 className="text-xl font-semibold text-white">
            {phase === 'voting' ? t('selectPlayerToVote') : t('selectTarget')}
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {alivePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={`p-4 rounded-lg transition ${
                  selectedPlayer === player.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                data-testid={`select-player-${player.id}`}
              >
                {player.user?.username}
              </button>
            ))}
          </div>

          <div className="flex gap-4 mt-4">
            {phase === 'voting' && (
              <button
                onClick={handleVote}
                disabled={!selectedPlayer}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="vote-button"
              >
                {t('vote')}
              </button>
            )}
            
            {phase === 'night' && myRole === 'mafia' && (
              <button
                onClick={handleEliminate}
                disabled={!selectedPlayer}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="eliminate-button"
              >
                {t('eliminate')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Phase transition button (for testing/demo) */}
      <button
        onClick={handleNextPhase}
        className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded font-semibold transition"
        data-testid="next-phase-button"
      >
        {t('nextPhase')}
      </button>
    </div>
  );
};

export default GamePhase;
