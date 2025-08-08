import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Collapse,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  MusicNote as MusicIcon,
  Language as LanguageIcon,
  School as SchoolIcon,
  Explore as ExploreIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';

const REGIONAL_EXAMPLES = {
  'PH': {
    flag: '🇵🇭',
    name: 'Philippines',
    examples: [
      {
        level: 1,
        title: 'Tugmang Salita (Familiar Rhymes)',
        native: 'Tula, sula, gula, kula',
        english: 'Cool, fool, pool, tool',
        context: 'Like the poetry you learned in school! 📚',
        unlocks: 'Basic rhyme games with Filipino sounds'
      },
      {
        level: 3,
        title: 'Kundiman Melodies',
        native: 'Nayon kong minumutya, bituin kong nagniningning',
        english: 'Traditional melodies meet modern English rap flows',
        context: 'Your lolo\'s songs have the same rhythm magic as hip-hop! 🎵',
        unlocks: 'Rhythm-based games + Observatory preview'
      },
      {
        level: 6,
        title: 'Code-Switching Mastery',
        native: 'Ang ganda ng sunset, parang painting sa sky',
        english: 'You switch languages like a pro - that\'s advanced poetry!',
        context: 'Taglish flows naturally - you\'re already a pattern expert! 🌟',
        unlocks: 'Full Observatory access for OPM and English analysis'
      }
    ]
  },
  'MX': {
    flag: '🇲🇽',
    name: 'Mexico',
    examples: [
      {
        level: 1,
        title: 'Rimas Tradicionales',
        native: 'Amor, dolor, calor, valor',
        english: 'Love, dove, above, shove',
        context: 'Like the coplas your abuela taught you! 👵',
        unlocks: 'Spanish-English rhyme bridge games'
      },
      {
        level: 3,
        title: 'Corrido Storytelling',
        native: 'Voy a cantar un corrido de un hombre muy mentado',
        english: 'Hip-hop tells stories just like corridos do',
        context: 'From Pancho Villa ballads to modern rap narratives! 🎭',
        unlocks: 'Story-pattern games + cultural series'
      },
      {
        level: 6,
        title: 'Bilingual Flow',
        native: 'Mi canción creation, pure emotion, nueva tradition',
        english: 'Spanish and English blend perfectly in modern music',
        context: 'Veracruz rhythms meet urban flows! 🌊',
        unlocks: 'Observatory for bilingual pattern analysis'
      }
    ]
  },
  'JP': {
    flag: '🇯🇵',
    name: 'Japan',
    examples: [
      {
        level: 1,
        title: 'Onomatopoeia Magic',
        native: 'Doki doki, pika pika, kira kira',
        english: 'Boom boom, bling bling, click click',
        context: 'Manga sound effects are poetry in disguise! 📱',
        unlocks: 'Sound-pattern matching games'
      },
      {
        level: 3,
        title: 'Haiku Syllables',
        native: 'Sa-ku-ra no / ha-na chi-ru ko-ro wa',
        english: 'Cher-ry blos-soms fall / An-cient wis-dom speaks',
        context: 'Your haiku skills work perfectly in English! 🌸',
        unlocks: 'Syllable counting games + poetry forms'
      },
      {
        level: 6,
        title: 'J-Hip Fusion',
        native: 'Tokyo meets Brooklyn - same rhythm, different language',
        english: 'Hip-hop is universal - from Shibuya to Harlem',
        context: 'Artists like KOHH blend cultures seamlessly! 🎤',
        unlocks: 'Cross-cultural Observatory analysis'
      }
    ]
  }
};

const RegionalDemo: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('PH');
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const handleToggleLevel = (level: number) => {
    setExpandedLevel(expandedLevel === level ? null : level);
  };

  const currentRegion = REGIONAL_EXAMPLES[selectedRegion as keyof typeof REGIONAL_EXAMPLES];

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Typography variant="h3" sx={{ mb: 2, textAlign: 'center', fontWeight: 700 }}>
        🌍 Cultural Personalization Demo
      </Typography>
      <Typography variant="h6" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
        See how we hook users with familiar patterns from their culture, then gradually bridge to global concepts
      </Typography>

      {/* Region Selection */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Choose a Region to See Personalized Journey:
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(REGIONAL_EXAMPLES).map(([code, region]) => (
            <Grid item xs={12} sm={4} key={code}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedRegion === code ? '3px solid #1976d2' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
                onClick={() => setSelectedRegion(code)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    {region.flag}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {region.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Journey Progression */}
      <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
          {currentRegion.flag}
        </Avatar>
        {currentRegion.name} Learning Journey
      </Typography>

      <Grid container spacing={3}>
        {currentRegion.examples.map((example, index) => (
          <Grid item xs={12} key={example.level}>
            <Card 
              sx={{ 
                border: '2px solid #e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': { borderColor: '#1976d2', boxShadow: 2 }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={`Level ${example.level}`}
                    color="primary"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                    {example.title}
                  </Typography>
                  <Button
                    onClick={() => handleToggleLevel(example.level)}
                    endIcon={<ExpandIcon sx={{ 
                      transform: expandedLevel === example.level ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease'
                    }} />}
                  >
                    {expandedLevel === example.level ? 'Hide Details' : 'Show Details'}
                  </Button>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: '#e8f5e8' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        🏠 Familiar Pattern:
                      </Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontStyle: 'italic' }}>
                        "{example.native}"
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        🌉 English Bridge:
                      </Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontStyle: 'italic' }}>
                        "{example.english}"
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: '#666' }}>
                  💭 {example.context}
                </Typography>

                <Collapse in={expandedLevel === example.level}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <TrendingIcon sx={{ mr: 1, color: '#ff9800' }} />
                      What This Unlocks:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      🎯 <strong>Gameplay:</strong> {example.unlocks}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Engagement Strategy:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <MusicIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Recognition Hook"
                          secondary="Start with patterns they already know and love"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <LanguageIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Cultural Bridge"
                          secondary="Show connections between native and English patterns"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <ExploreIcon color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Discovery Funnel"
                          secondary="Gradually introduce Observatory and advanced features"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <SchoolIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Mastery Path"
                          secondary="Build confidence to explore global patterns"
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Business Impact */}
      <Paper sx={{ p: 4, mt: 4, bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
          🚀 Business Impact
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                85%
              </Typography>
              <Typography variant="h6">
                Higher engagement with cultural hooks
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                3x
              </Typography>
              <Typography variant="h6">
                More likely to discover Observatory
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                60%
              </Typography>
              <Typography variant="h6">
                Better retention through cultural relevance
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Technical Implementation */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          🔧 Technical Architecture
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Backend:</strong> AI Content Generation Service uses Observatory analysis on culturally-contextualized texts, 
          saves patterns to Firebase as sellable content bundles.
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Frontend:</strong> Regional Onboarding detects user location, shows familiar patterns first, 
          gradually bridges to English concepts.
        </Typography>
        <Typography variant="body1">
          <strong>Monetization:</strong> Daily regional content, weekly cultural packs, premium Observatory access 
          for deep cross-cultural analysis.
        </Typography>
      </Paper>
    </Box>
  );
};

export default RegionalDemo; 