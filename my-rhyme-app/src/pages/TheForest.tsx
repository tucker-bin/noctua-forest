import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Avatar, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';

interface Artist {
  id: string;
  artistName: string;
  genre: string;
  location: string;
  avatar: string;
  bio: string;
}

const TheForest: React.FC = () => {
  const { t } = useTranslation();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        // The proxy in vite.config.ts will forward this to http://127.0.0.1:5001/api/users
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setArtists(data);
      } catch (error) {
        console.error("Failed to fetch artists:", error);
        // In a real app, you might want to show an error message to the user
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  return (
    <Layout owlMessage={t('noctua_forest_welcome', 'Welcome to my Forest! Here you can discover fellow creators and explore the community that calls this place home.')}>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700, 
                  color: 'secondary.main',
                  fontFamily: '"Space Grotesk", sans-serif',
                }}
              >
                Welcome to Noctua's Forest
              </Typography>
              <Typography 
                variant="h5" 
                color="text.secondary" 
                sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}
              >
                Discover artists, poets, and creators who call this Forest home. 
                Each one brings their unique voice to our growing community.
              </Typography>
            </motion.div>
          </Box>

          <Grid container spacing={4}>
            {artists.map((artist, index) => (
              <Grid item xs={12} md={6} lg={4} key={artist.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      background: 'rgba(43, 58, 103, 0.5)',
                      border: '1px solid rgba(255, 215, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Avatar
                        src={artist.avatar}
                        alt={artist.artistName}
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          mx: 'auto', 
                          mb: 2,
                          border: '3px solid rgba(255, 215, 0, 0.3)'
                        }}
                      />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'secondary.main',
                          fontFamily: '"Space Grotesk", sans-serif',
                          mb: 1
                        }}
                      >
                        {artist.artistName}
                      </Typography>
                      <Chip 
                        label={artist.genre}
                        size="small"
                        sx={{ 
                          mb: 1,
                          backgroundColor: 'rgba(255, 215, 0, 0.2)',
                          color: 'secondary.main'
                        }}
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 2 }}
                      >
                        {artist.location}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.primary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        {artist.bio}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 8, py: 6 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  color: 'secondary.main',
                  fontFamily: '"Space Grotesk", sans-serif',
                  mb: 2
                }}
              >
                More Forest Dwellers Coming Soon
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The Forest is growing! Soon you'll be able to create your own profile, 
                share your work, and connect with fellow creators in Noctua's community.
              </Typography>
            </motion.div>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default TheForest; 