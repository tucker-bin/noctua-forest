import React from 'react';
import { useTranslation } from 'react-i18next';

const TermsOfService: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h2>{t('terms_title')}</h2>
      <p>{t('terms_last_updated')}</p>
      <h4>{t('terms_acceptance')}</h4>
      <p>{t('terms_acceptance_text')}</p>
      <h4>{t('terms_copyright')}</h4>
      <p>{t('terms_copyright_text')}</p>
      <h4>{t('terms_conduct')}</h4>
      <ul>
        <li>{t('terms_conduct_1')}</li>
        <li>{t('terms_conduct_2')}</li>
        <li>{t('terms_conduct_3')}</li>
      </ul>
      <h4>{t('terms_disclaimer')}</h4>
      <p>{t('terms_disclaimer_text')}</p>
      <h4>{t('terms_liability')}</h4>
      <p>{t('terms_liability_text')}</p>
      <h4>{t('terms_changes')}</h4>
      <p>{t('terms_changes_text')}</p>
      <h4>{t('terms_contact')}</h4>
      <p>{t('terms_contact_text')}</p>
      <h4>{t('terms_ai_content')}</h4>
      <p>{t('terms_ai_content_text')}</p>
    </div>
  );
};

export default TermsOfService; 