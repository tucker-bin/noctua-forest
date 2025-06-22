import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { privacyService, type PrivacySettings, type DataSummary } from '../../services/privacyService';
import { useAuth } from '../../contexts/AuthContext';

const DataPrivacyCenter: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [showDeletionForm, setShowDeletionForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [privacySettings, summary] = await Promise.all([
        privacyService.getPrivacySettings(),
        privacyService.getDataSummary()
      ]);
      
      setSettings(privacySettings);
      setDataSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load privacy data');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof PrivacySettings, value: any) => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      
      const updatedSettings = await privacyService.updatePrivacySettings({
        [key]: value
      });
      
      setSettings(updatedSettings);
      setSuccess('Privacy settings updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      setError(null);
      
      const dataBlob = await privacyService.exportUserData();
      privacyService.downloadDataExport(dataBlob);
      
      setSuccess('Data export downloaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletionReason.trim()) {
      setError('Please provide a reason for account deletion');
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      
      const result = await privacyService.requestDataDeletion(deletionReason);
      
      setSuccess(`Account deletion requested successfully. Request ID: ${result.deletionRequestId}. You will receive confirmation within ${result.processingTimeframe}.`);
      setShowDeletionForm(false);
      setDeletionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request account deletion');
    } finally {
      setDeleting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800">{t('gdpr.signInRequired')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('gdpr.dataPrivacyCenter')}
        </h1>
        <p className="text-gray-600">
          {t('gdpr.manageDataDescription')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Data Summary */}
      {dataSummary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('gdpr.dataSummary')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">{t('gdpr.accountInfo')}</h3>
              <p className="text-sm text-gray-600">
                {t('gdpr.accountCreated')}: {new Date(dataSummary.profile.accountCreated).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                {t('gdpr.lastActive')}: {new Date(dataSummary.profile.lastActive).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">{t('gdpr.dataTypes')}</h3>
              <p className="text-sm text-gray-600">
                {t('gdpr.observations')}: {dataSummary.dataTypes.observations}
              </p>
              <p className="text-sm text-gray-600">
                {t('gdpr.lessonProgress')}: {dataSummary.dataTypes.lessonProgress}
              </p>
              <p className="text-sm text-gray-600">
                {t('gdpr.feedback')}: {dataSummary.dataTypes.feedback}
              </p>
              <p className="text-sm text-gray-600">
                {t('gdpr.totalSize')}: {dataSummary.storage.estimatedSize}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      {settings && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('gdpr.privacySettings')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-700">{t('gdpr.dataProcessing')}</h3>
                <p className="text-sm text-gray-500">{t('gdpr.dataProcessingDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dataProcessing}
                  onChange={(e) => handleSettingChange('dataProcessing', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-700">{t('gdpr.analytics')}</h3>
                <p className="text-sm text-gray-500">{t('gdpr.analyticsDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.analytics}
                  onChange={(e) => handleSettingChange('analytics', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-700">{t('gdpr.marketing')}</h3>
                <p className="text-sm text-gray-500">{t('gdpr.marketingDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.marketing}
                  onChange={(e) => handleSettingChange('marketing', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-700">{t('gdpr.profileVisibility')}</h3>
                <p className="text-sm text-gray-500">{t('gdpr.profileVisibilityDesc')}</p>
              </div>
              <select
                value={settings.profileVisibility}
                onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                disabled={saving}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="private">{t('gdpr.private')}</option>
                <option value="friends">{t('gdpr.friends')}</option>
                <option value="public">{t('gdpr.public')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Data Rights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('gdpr.yourRights')}
        </h2>
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-medium text-gray-700 mb-2">{t('gdpr.rightToAccess')}</h3>
            <p className="text-sm text-gray-600 mb-3">{t('gdpr.rightToAccessDesc')}</p>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? t('gdpr.exporting') : t('gdpr.exportData')}
            </button>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">{t('gdpr.rightToErasure')}</h3>
            <p className="text-sm text-gray-600 mb-3">{t('gdpr.rightToErasureDesc')}</p>
            {!showDeletionForm ? (
              <button
                onClick={() => setShowDeletionForm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {t('gdpr.deleteAccount')}
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder={t('gdpr.deletionReasonPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletionReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? t('gdpr.processing') : t('gdpr.confirmDeletion')}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeletionForm(false);
                      setDeletionReason('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {t('gdpr.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>{t('gdpr.contactInfo')}: privacy@noctuaforest.com</p>
        <p>{t('gdpr.lastUpdated')}: {settings?.updatedAt.toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default DataPrivacyCenter; 