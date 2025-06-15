import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/localeFormat';
import Tooltip from '@mui/material/Tooltip';
import { FaMedal, FaStar, FaFeatherAlt } from 'react-icons/fa';

// Mock artist data (replace with real data integration later)
const MOCK_ARTIST = {
  id: '1',
  artistName: 'Noctua Flow',
  genre: 'Poet & Storyteller',
  location: 'London, UK',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owl',
  bio: 'Wordplay wizard and rhyme pattern enthusiast. Exploring the music of language with every line.',
  releases: [
    { title: 'Moonlit Verses', date: '2023-11-01' },
    { title: 'Owl City Sessions', date: '2023-08-15' }
  ],
  news: [
    { headline: 'Featured in Noctua Weekly!', date: '2024-04-01' }
  ],
  events: [
    { name: 'Open Mic Night', date: '2024-06-15', location: 'London, UK' }
  ]
};

// Mock recent activity data
const MOCK_ACTIVITY = [
  { id: 'a1', date: '2024-06-14', snippet: 'The owl glides through moonlit air...', result: 'Phonetic: assonance, Rhyme: ABAB' },
  { id: 'a2', date: '2024-06-12', snippet: 'Night falls, the city hums below...', result: 'Phonetic: consonance, Rhyme: AABB' },
];

// Mock badges
const BADGES = [
  { icon: <FaMedal />, label: 'Verified Artist', key: 'verified' },
  { icon: <FaStar />, label: 'First Release', key: 'first_release' },
  { icon: <FaFeatherAlt />, label: 'Active Contributor', key: 'active' },
];

// Add fade-in animation CSS
const fadeInStyle = {
  animation: 'fadeIn 0.7s ease',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'none' }
  }
};

const ArtistProfile: React.FC = () => {
  const [showContact, setShowContact] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100 flex flex-col items-center text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-1 flex items-center justify-center gap-2">
            <span role="img" aria-label="owl">🦉</span> {t('welcome')}
          </h1>
          <p className="text-gray-500 mb-4">{t('subtitle')}</p>
          <img
            src={MOCK_ARTIST.avatar}
            alt={MOCK_ARTIST.artistName}
            className="w-32 h-32 rounded-full mb-4 border-4 border-blue-200 shadow"
          />
          <h2 className="text-3xl font-extrabold text-blue-700 mb-1">{MOCK_ARTIST.artistName}</h2>
          <p className="text-lg text-gray-500 mb-1">{MOCK_ARTIST.genre}</p>
          <p className="text-sm text-gray-400 mb-2">{MOCK_ARTIST.location}</p>
          <p className="text-gray-700 mb-4 max-w-xl mx-auto">{MOCK_ARTIST.bio}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowShare(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            >
              {t('share_profile')}
            </button>
            <button
              onClick={() => setShowContact(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              {t('contact')}
            </button>
          </div>
        </div>
        {/* Badges Row */}
        <div className="flex flex-wrap gap-2 justify-center mb-6" style={fadeInStyle}>
          {BADGES.map(badge => (
            <Tooltip key={badge.key} title={badge.label} placement="top">
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold shadow cursor-help" tabIndex={0} aria-label={badge.label}>
                {badge.icon}
              </span>
            </Tooltip>
          ))}
        </div>
        {/* Releases, News, Events */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-4 border border-blue-100">
            <h2 className="text-lg font-bold text-blue-700 mb-2">{t('releases')}</h2>
            {MOCK_ARTIST.releases.length ? (
              <ul className="space-y-1">
                {MOCK_ARTIST.releases.map(r => (
                  <li key={r.title} className="text-gray-700">{r.title} <span className="text-xs text-gray-400">({formatDate(r.date)})</span></li>
                ))}
              </ul>
            ) : <p className="text-gray-400">No releases yet.</p>}
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-blue-100">
            <h2 className="text-lg font-bold text-blue-700 mb-2">{t('latest_news')}</h2>
            {MOCK_ARTIST.news.length ? (
              <ul className="space-y-1">
                {MOCK_ARTIST.news.map(n => (
                  <li key={n.headline} className="text-gray-700">{n.headline} <span className="text-xs text-gray-400">({formatDate(n.date)})</span></li>
                ))}
              </ul>
            ) : <p className="text-gray-400">No news yet.</p>}
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-blue-100">
            <h2 className="text-lg font-bold text-blue-700 mb-2">{t('upcoming_events')}</h2>
            {MOCK_ARTIST.events.length ? (
              <ul className="space-y-1">
                {MOCK_ARTIST.events.map(e => (
                  <li key={e.name} className="text-gray-700">{e.name} <span className="text-xs text-gray-400">({formatDate(e.date)}, {e.location})</span></li>
                ))}
              </ul>
            ) : <p className="text-gray-400">No events scheduled.</p>}
          </div>
        </div>
        {/* Recent Observatory Activity */}
        <div className="bg-white rounded-xl shadow p-4 border border-blue-100 mb-8" style={fadeInStyle}>
          <h2 className="text-lg font-bold text-blue-700 mb-2">Recent Observatory Activity</h2>
          {MOCK_ACTIVITY.length ? (
            <ul className="space-y-2">
              {MOCK_ACTIVITY.map(a => (
                <li key={a.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-gray-100 pb-2 last:border-b-0">
                  <div>
                    <span className="text-xs text-gray-400 mr-2">{formatDate(a.date)}</span>
                    <span className="text-gray-700">{a.snippet}</span>
                    <span className="ml-2 text-xs text-blue-400">{a.result}</span>
                  </div>
                  <Tooltip title="View details" placement="top">
                    <button className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-sm" aria-label="View details">
                      View
                    </button>
                  </Tooltip>
                </li>
              ))}
            </ul>
          ) : <p className="text-gray-400">No recent activity.</p>}
        </div>
        {/* Share Modal */}
        {showShare && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
              <h3 className="text-xl font-bold mb-4 text-blue-700">{t('share_this_profile')}</h3>
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="w-full p-2 rounded border border-gray-300 mb-4 text-gray-600"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all mb-2"
              >
                {copied ? t('copied') : t('copy_link')}
              </button>
              <div className="mt-2">
                <button
                  onClick={() => setShowShare(false)}
                  className="text-gray-400 hover:text-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Contact Modal */}
        {showContact && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
              <h3 className="text-xl font-bold mb-4 text-blue-700">{t('contact')} {MOCK_ARTIST.artistName}</h3>
              <form className="space-y-3">
                <input type="text" placeholder="Your Name" className="w-full p-2 rounded border border-gray-300" />
                <input type="email" placeholder="Your Email" className="w-full p-2 rounded border border-gray-300" />
                <textarea placeholder="Your Message" className="w-full p-2 rounded border border-gray-300" rows={3} />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                >
                  {t('send_message')}
                </button>
              </form>
              <div className="mt-2">
                <button
                  onClick={() => setShowContact(false)}
                  className="text-gray-400 hover:text-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Sign-up CTA for anonymous users */}
        <div className="text-center mt-8">
          <p className="text-gray-500">{t('want_to_connect')}</p>
          <a
            href="/artist-signup"
            className="inline-block mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          >
            {t('sign_up_to_join')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile; 