import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const [userType, setUserType] = useState('');

  return (
    <div>
      <h1>{t('signup_as')}</h1>
      <select value={userType} onChange={(e) => setUserType(e.target.value)}>
        <option value="artist">{t('artist')}</option>
        <option value="owl">{t('owl')}</option>
        <option value="tester">{t('tester')}</option>
      </select>
      <input type="text" placeholder={t('first_name')} />
      <input type="text" placeholder={t('last_name')} />
      <input type="text" placeholder={t('artist_name')} />
      <input type="text" placeholder={t('location')} />
      <input type="email" placeholder={t('email')} />
      <input type="password" placeholder={t('password')} />
      <input type="text" placeholder={t('invite_code_optional')} />
      <button>{t('sign_up')}</button>
    </div>
  );
};

export default SignUp; 