import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CreateGameModal = ({ onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    room_name: '',
    max_players: 8,
    game_mode: 'simple',
    custom_roles: {
      mafia: 2,
      detective: 1,
      doctor: 1,
      sniper: 0,
      citizen: 4,
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role, value) => {
    setFormData({
      ...formData,
      custom_roles: {
        ...formData.custom_roles,
        [role]: parseInt(value),
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const dataToSubmit = {
      room_name: formData.room_name,
      max_players: parseInt(formData.max_players),
      game_mode: formData.game_mode,
    };

    if (formData.game_mode === 'custom') {
      dataToSubmit.custom_roles = formData.custom_roles;
    }

    onSubmit(dataToSubmit);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" data-testid="create-game-modal">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6" data-testid="modal-title">{t('createGame')}</h2>

        <form onSubmit={handleSubmit} data-testid="create-game-form">
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="room_name">
              {t('roomName')}
            </label>
            <input
              type="text"
              id="room_name"
              name="room_name"
              value={formData.room_name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              required
              data-testid="room-name-input"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="max_players">
              {t('maxPlayers')} (4-20)
            </label>
            <input
              type="number"
              id="max_players"
              name="max_players"
              value={formData.max_players}
              onChange={handleChange}
              min="4"
              max="20"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              required
              data-testid="max-players-input"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="game_mode">
              {t('gameMode')}
            </label>
            <select
              id="game_mode"
              name="game_mode"
              value={formData.game_mode}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              data-testid="game-mode-select"
            >
              <option value="simple">{t('simple')}</option>
              <option value="complete">{t('complete')}</option>
              <option value="custom">{t('custom')}</option>
            </select>
          </div>

          {formData.game_mode === 'custom' && (
            <div className="mb-4 p-4 bg-gray-700 rounded" data-testid="custom-roles-section">
              <h3 className="text-white font-semibold mb-3">{t('customRoles')}</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">{t('roles.mafia')}</label>
                  <input
                    type="number"
                    value={formData.custom_roles.mafia}
                    onChange={(e) => handleRoleChange('mafia', e.target.value)}
                    min="1"
                    className="w-16 px-2 py-1 bg-gray-600 text-white rounded"
                    data-testid="mafia-count-input"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">{t('roles.detective')}</label>
                  <input
                    type="number"
                    value={formData.custom_roles.detective}
                    onChange={(e) => handleRoleChange('detective', e.target.value)}
                    min="0"
                    className="w-16 px-2 py-1 bg-gray-600 text-white rounded"
                    data-testid="detective-count-input"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">{t('roles.doctor')}</label>
                  <input
                    type="number"
                    value={formData.custom_roles.doctor}
                    onChange={(e) => handleRoleChange('doctor', e.target.value)}
                    min="0"
                    className="w-16 px-2 py-1 bg-gray-600 text-white rounded"
                    data-testid="doctor-count-input"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">{t('roles.sniper')}</label>
                  <input
                    type="number"
                    value={formData.custom_roles.sniper}
                    onChange={(e) => handleRoleChange('sniper', e.target.value)}
                    min="0"
                    className="w-16 px-2 py-1 bg-gray-600 text-white rounded"
                    data-testid="sniper-count-input"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <label className="text-gray-300">{t('roles.citizen')}</label>
                  <input
                    type="number"
                    value={formData.custom_roles.citizen}
                    onChange={(e) => handleRoleChange('citizen', e.target.value)}
                    min="1"
                    className="w-16 px-2 py-1 bg-gray-600 text-white rounded"
                    data-testid="citizen-count-input"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded font-semibold transition"
              data-testid="cancel-button"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded font-semibold transition"
              data-testid="submit-button"
            >
              {t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGameModal;
