import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const GENRES = [
  'All',
  'Poetry',
  'Spoken Word',
  'Singer-Songwriter',
  'Pop',
  'Rock',
  'Jazz',
  'Classical',
  'Folk',
  'R&B/Soul',
  'Country',
  'Electronic',
  'Experimental',
  'Indie/Alternative',
  'World/Global',
  'Storytelling',
  'Comedy/Parody',
  'Theatre/Drama',
  "Children's/Family",
  'Other',
];

const USER_TYPES = [
  { value: 'artist', label: 'Artist (poet, songwriter, performer, etc.)' },
  { value: 'owl', label: 'Owl (learner, fan, listener, educator, etc.)' },
  { value: 'tester', label: 'Tester (unlimited access)' },
  { value: 'other', label: 'Other' },
];

const ArtistSignUp: React.FC = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    artistName: '',
    location: '',
    genre: '',
    email: '',
    password: '',
    inviteCode: '',
    isTester: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('artist');
  const [otherType, setOtherType] = useState('');
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    // TODO: Integrate with backend
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-blue-100 transition-all">
        <h2 className="text-3xl font-extrabold mb-2 text-blue-700 text-center flex items-center justify-center gap-2">
          <span role="img" aria-label="owl">🦉</span> {t('welcome')}
        </h2>
        <p className="text-gray-500 mb-6 text-center">{t('subtitle')}</p>
        {success ? (
          <div className="text-center animate-bounce">
            <p className="text-green-600 font-semibold mb-4">Sign up successful! Welcome to Noctua Forest 🎤🦉</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup_as')}</label>
              <select
                value={userType}
                onChange={e => {
                  setUserType(e.target.value);
                  setForm(f => ({ ...f, isTester: e.target.value === 'tester' }));
                }}
                className="p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full bg-white"
              >
                {USER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {userType === 'other' && (
                <input
                  type="text"
                  placeholder="Please specify"
                  value={otherType}
                  onChange={e => setOtherType(e.target.value)}
                  className="mt-2 p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full"
                />
              )}
            </div>
            {userType === 'artist' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder={t('first_name')}
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder={t('last_name')}
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full"
                  />
                </div>
                <input
                  type="text"
                  name="artistName"
                  placeholder={t('artist_name')}
                  value={form.artistName}
                  onChange={handleChange}
                  required
                  className="p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full"
                />
                <input
                  type="text"
                  name="location"
                  placeholder={t('location')}
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full"
                />
                <select
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  required
                  className="p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full bg-white"
                >
                  <option value="">{t('select_genre')}</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </>
            )}
            <input
              type="email"
              name="email"
              placeholder={t('email')}
              value={form.email}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full"
            />
            <input
              type="password"
              name="password"
              placeholder={t('password')}
              value={form.password}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full"
            />
            <input
              type="text"
              name="inviteCode"
              placeholder={t('invite_code_optional')}
              value={form.inviteCode}
              onChange={handleChange}
              className="p-3 rounded-lg border border-gray-300 focus:ring-blue-400 focus:border-blue-400 w-full"
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all disabled:opacity-50"
            >
              {submitting ? t('signing_up') : t('sign_up')}
            </button>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <a href="/privacy" className="hover:underline">{t('privacy_policy')}</a>
              <a href="/terms" className="hover:underline">{t('terms_and_agreements')}</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ArtistSignUp; 