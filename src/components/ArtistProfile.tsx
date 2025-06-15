import React from 'react';
import { useTranslation } from 'react-i18next';

const ArtistProfile: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('artist')}</h1>
      <p>{t('releases')}</p>
      <p>{t('latest_news')}</p>
      <p>{t('upcoming_events')}</p>
      <button>{t('share_profile')}</button>
      <button>{t('contact')}</button>
    </div>
  );
};

export default ArtistProfile; 