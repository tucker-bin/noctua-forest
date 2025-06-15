import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Observatory: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const handleAnalyze = () => {
    // Logic for analyzing text
  };

  return (
    <div>
      <h1>{t('observatory_title')}</h1>
      <p>{t('observatory_subtitle')}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('enter_text_to_analyze')}
      />
      <button onClick={handleAnalyze}>{t('analyze_text')}</button>
    </div>
  );
};

export default Observatory; 