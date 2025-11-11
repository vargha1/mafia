import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <p className="text-white text-2xl" data-testid="loading-text">{t('loading')}</p>
      </div>
    );
  }

  const winRate = profile?.total_games > 0 
    ? ((profile.wins / profile.total_games) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
            data-testid="back-to-dashboard-button"
          >
            ← {t('backToLobby')}
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-2xl p-8" data-testid="profile-card">
          <h1 className="text-4xl font-bold text-white mb-8 text-center" data-testid="profile-title">
            {t('profile')}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Info */}
            <div className="bg-gray-700 rounded-lg p-6" data-testid="user-info-section">
              <h2 className="text-2xl font-semibold text-white mb-4">{t('userInfo')}</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">{t('username')}</p>
                  <p className="text-white text-xl font-semibold" data-testid="profile-username">{profile?.username}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{t('email')}</p>
                  <p className="text-white" data-testid="profile-email">{profile?.email}</p>
                </div>
              </div>
            </div>

            {/* Level & XP */}
            <div className="bg-gray-700 rounded-lg p-6" data-testid="level-section">
              <h2 className="text-2xl font-semibold text-white mb-4">{t('progression')}</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">{t('level')}</p>
                  <p className="text-yellow-400 text-4xl font-bold" data-testid="profile-level">{profile?.level}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{t('xp')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-xl" data-testid="profile-xp">{profile?.xp}</p>
                    <span className="text-gray-400 text-sm">/ {(profile?.level || 1) * 1000}</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{
                        width: `${((profile?.xp % 1000) / 1000) * 100}%`,
                      }}
                      data-testid="xp-progress-bar"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-700 rounded-lg p-6 md:col-span-2" data-testid="stats-section">
              <h2 className="text-2xl font-semibold text-white mb-4">{t('statistics')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-600 rounded">
                  <p className="text-gray-400 text-sm mb-1">{t('totalGames')}</p>
                  <p className="text-white text-3xl font-bold" data-testid="total-games">{profile?.total_games || 0}</p>
                </div>
                <div className="text-center p-4 bg-green-700 rounded">
                  <p className="text-gray-200 text-sm mb-1">{t('wins')}</p>
                  <p className="text-white text-3xl font-bold" data-testid="wins">{profile?.wins || 0}</p>
                </div>
                <div className="text-center p-4 bg-red-700 rounded">
                  <p className="text-gray-200 text-sm mb-1">{t('losses')}</p>
                  <p className="text-white text-3xl font-bold" data-testid="losses">{profile?.losses || 0}</p>
                </div>
                <div className="text-center p-4 bg-blue-700 rounded">
                  <p className="text-gray-200 text-sm mb-1">{t('winRate')}</p>
                  <p className="text-white text-3xl font-bold" data-testid="win-rate">{winRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
