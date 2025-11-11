import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { gameAPI, userAPI } from '../services/api';
import CreateGameModal from '../components/CreateGameModal';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchGames();
    fetchLeaderboard();
    const interval = setInterval(fetchGames, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const response = await gameAPI.getAvailableGames();
      setGames(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch games:', error);
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await userAPI.getLeaderboard(10);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const handleJoinGame = async (gameId) => {
    try {
      await gameAPI.joinGame(gameId);
      navigate(`/game/${gameId}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join game');
    }
  };

  const handleCreateGame = async (gameData) => {
    try {
      const response = await gameAPI.createGame(gameData);
      setShowCreateModal(false);
      navigate(`/game/${response.data.id}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create game');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 flex justify-between items-center" data-testid="dashboard-header">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="dashboard-title">{t('appName')}</h1>
            <div className="text-gray-300" data-testid="user-info">
              <span className="font-semibold">{user?.username}</span> | 
              <span className="ml-2">{t('level')}: {user?.level}</span> | 
              <span className="ml-2">{t('xp')}: {user?.xp}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <LanguageSwitcher />
            <button
              onClick={() => navigate('/profile')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
              data-testid="profile-button"
            >
              {t('profile')}
            </button>
            <button
              onClick={logout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition"
              data-testid="logout-button"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Games List */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white" data-testid="available-games-title">{t('availableGames')}</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition"
                data-testid="create-game-button"
              >
                {t('createGame')}
              </button>
            </div>

            {loading ? (
              <p className="text-gray-400 text-center py-8" data-testid="loading-text">{t('loading')}</p>
            ) : games.length === 0 ? (
              <p className="text-gray-400 text-center py-8" data-testid="no-games-text">{t('noGamesAvailable')}</p>
            ) : (
              <div className="space-y-4" data-testid="games-list">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition"
                    data-testid={`game-item-${game.id}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1" data-testid={`game-name-${game.id}`}>
                          {game.room_name}
                        </h3>
                        <div className="text-gray-300 text-sm">
                          <span data-testid={`game-players-${game.id}`}>{t('players')}: {game.current_players}/{game.max_players}</span>
                          <span className="mx-2">|</span>
                          <span data-testid={`game-mode-${game.id}`}>{t('gameMode')}: {t(game.game_mode)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinGame(game.id)}
                        disabled={game.current_players >= game.max_players}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid={`join-game-button-${game.id}`}
                      >
                        {t('joinGame')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6" data-testid="leaderboard-title">{t('leaderboard')}</h2>
            <div className="space-y-3" data-testid="leaderboard-list">
              {leaderboard.map((player, index) => (
                <div
                  key={player.id}
                  className="bg-gray-700 rounded p-3 flex items-center justify-between"
                  data-testid={`leaderboard-item-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-gray-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-600 text-gray-300'
                    }`} data-testid={`leaderboard-rank-${index}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-semibold" data-testid={`leaderboard-username-${index}`}>{player.username}</p>
                      <p className="text-gray-400 text-sm" data-testid={`leaderboard-stats-${index}`}>
                        {t('level')} {player.level} | {player.xp} {t('xp')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateGameModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGame}
        />
      )}
    </div>
  );
};

export default Dashboard;
