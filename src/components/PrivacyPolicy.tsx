import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h2>{t('privacy_title')}</h2>
      <p>{t('privacy_last_updated')}</p>
      <h4>{t('privacy_collect')}</h4>
      <p>{t('privacy_collect_text')}</p>
      <h4>{t('privacy_use')}</h4>
      <p>{t('privacy_use_text')}</p>
      <h4>{t('privacy_cookies')}</h4>
      <p>{t('privacy_cookies_text')}</p>
      <h4>{t('privacy_third_party')}</h4>
      <p>{t('privacy_third_party_text')}</p>
      <h4>{t('privacy_security')}</h4>
      <p>{t('privacy_security_text')}</p>
      <h4>{t('privacy_rights')}</h4>
      <p>{t('privacy_rights_text')}</p>
      <h4>{t('privacy_changes')}</h4>
      <p>{t('privacy_changes_text')}</p>
      <h4>{t('privacy_contact')}</h4>
      <p>{t('privacy_contact_text')}</p>
    </div>
  );
};

export default PrivacyPolicy; 