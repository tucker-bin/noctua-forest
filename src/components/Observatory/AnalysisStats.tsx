import React from 'react';
import { Grid, Paper, Typography, Box, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
    title: string;
    value: string | number;
    description: string;
    highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, highlight }) => (
    <Paper 
        variant="outlined" 
        sx={{ 
            p: 2, 
            height: '100%',
            backgroundColor: highlight ? 'primary.50' : 'background.paper',
            borderColor: highlight ? 'primary.main' : 'divider'
        }}
    >
        <Typography variant="overline" color="text.secondary">{title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: highlight ? 'primary.main' : 'text.primary' }}>
                {typeof value === 'number' && value > 999 ? `${(value/1000).toFixed(1)}k` : value}
            </Typography>
            {highlight && <Chip label="Comprehensive" size="small" color="primary" variant="outlined" />}
        </Box>
        <Typography variant="caption" color="text.secondary">{description}</Typography>
    </Paper>
);

interface AnalysisStatsProps {
    patternCount: number;
    totalMatches: number;
    avgPerPattern: number;
    patternTypes: number;
}

export const AnalysisStats: React.FC<AnalysisStatsProps> = ({ patternCount, totalMatches, avgPerPattern, patternTypes }) => {
    const { t } = useTranslation();

    // Determine if this is a comprehensive analysis
    const isComprehensive = patternCount >= 50;
    const isVeryComprehensive = patternCount >= 100;

    const stats = [
        { 
            title: 'Sound Patterns', 
            value: patternCount, 
            description: isVeryComprehensive ? 'Ultra-comprehensive analysis' : isComprehensive ? 'Comprehensive analysis' : 'Pattern groups found',
            highlight: isComprehensive
        },
        { 
            title: 'Total Instances', 
            value: totalMatches, 
            description: 'All occurrences detected'
        },
        { 
            title: 'Density', 
            value: avgPerPattern.toFixed(1), 
            description: 'Avg instances per pattern'
        },
        { 
            title: 'Sound Types', 
            value: patternTypes, 
            description: 'Distinct acoustic categories'
        },
    ];

    return (
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, md: 2 } }}>
                {stats.map((stat) => (
                    <Box key={stat.title} sx={{ flex: 1 }}>
                        <StatCard 
                            title={stat.title} 
                            value={stat.value} 
                            description={stat.description}
                            highlight={stat.highlight}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
}; 