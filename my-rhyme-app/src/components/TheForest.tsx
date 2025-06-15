import React from 'react';

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

const MOCK_ARTISTS = [
  {
    id: '1',
    artistName: 'Noctua Flow',
    genre: 'Poet',
    location: 'London, UK',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owl',
    bio: 'Wordplay wizard and rhyme pattern enthusiast.'
  },
  {
    id: '2',
    artistName: 'Rhythm Sage',
    genre: 'Storytelling',
    location: 'Brooklyn, NY',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sage',
    bio: 'Old school vibes, new school verses.'
  },
  {
    id: '3',
    artistName: 'Verse Owl',
    genre: 'Spoken Word',
    location: 'Berlin, DE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=verse',
    bio: 'Nocturnal lyricist with a love for multis.'
  },
];

const TheForest: React.FC = () => {
  return (
    <div>
      <h2>The Forest</h2>
      <p>Discover artists and their work in the Noctua Forest community.</p>
      {/* TODO: Implement the forest component */}
    </div>
  );
};

export default TheForest; 