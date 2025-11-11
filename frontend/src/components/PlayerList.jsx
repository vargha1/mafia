import React from 'react';
import { useTranslation } from 'react-i18next';

const PlayerList = ({ players, currentUserId, gameStatus, myRole }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6" data-testid="player-list">
      <h3 className="text-xl font-bold text-white mb-4">
        {t('players')} ({players.length})
      </h3>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`p-3 rounded ${
              player.user_id === currentUserId
                ? 'bg-blue-700'
                : player.is_ready
                ? 'bg-green-700'
                : 'bg-gray-700'
            }`}
            data-testid={`player-${player.id}`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-semibold" data-testid={`player-name-${player.id}`}>
                  {player.user?.username || 'Player'}
                  {player.user_id === currentUserId && ' (You)'}
                </p>
                {gameStatus === 'in_progress' && (
                  <p className="text-sm text-gray-300" data-testid={`player-status-${player.id}`}>
                    {player.is_alive ? t('alive') : t('dead')}
                  </p>
                )}
              </div>
              {gameStatus === 'waiting' && (
                <span
                  className={`text-sm font-semibold ${
                    player.is_ready ? 'text-green-300' : 'text-yellow-300'
                  }`}
                  data-testid={`player-ready-${player.id}`}
                >
                  {player.is_ready ? t('ready') : t('notReady')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
