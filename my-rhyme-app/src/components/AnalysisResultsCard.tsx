import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, Stack, TextField } from '@mui/material';

const rhymeGroups = [
  { id: 1, type: 'Perfect Rhyme', color: '#4F8CFF', segments: ['load', 'code'], description: 'Shared /oʊd/ sound.' },
  { id: 2, type: 'Slant Rhyme', color: '#81C784', segments: ['time', 'line'], description: 'Similar ending consonants.' },
];

const AnalysisResultsCard: React.FC = () => {
  const [notes, setNotes] = useState<{ [id: number]: string }>({});
  const [saved, setSaved] = useState<{ [id: number]: boolean }>({});

  return (
    <Box sx={{ p: 2, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Analysis Results</Typography>
      <Stack spacing={2}>
        {rhymeGroups.map(group => (
          <Card key={group.id} sx={{ borderLeft: `8px solid ${group.color}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip label={group.type} sx={{ bgcolor: group.color, color: '#fff', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">{group.description}</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {group.segments.join(', ')}
              </Typography>
              <TextField
                label="Add a note (optional)"
                size="small"
                fullWidth
                value={notes[group.id] || ''}
                onChange={e => setNotes({ ...notes, [group.id]: e.target.value })}
                sx={{ mb: 1 }}
              />
              <Button
                variant={saved[group.id] ? 'outlined' : 'contained'}
                color="primary"
                size="small"
                onClick={() => setSaved({ ...saved, [group.id]: !saved[group.id] })}
                sx={{ mr: 1 }}
              >
                {saved[group.id] ? 'Saved' : 'Save'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="subtitle2" color="text.secondary">
          What will you do with this insight? Try rewriting a line or save your progress!
        </Typography>
      </Box>
    </Box>
  );
};

export default AnalysisResultsCard; 