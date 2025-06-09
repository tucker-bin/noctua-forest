import React, { useState, useCallback, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    useTheme,
    useMediaQuery,
    Card,
    CardContent,
    Chip,
    Stack,
    IconButton,
    Tooltip,
    LinearProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import debounce from 'lodash/debounce';

export interface AnalysisData {
    original_text: string;
    rhyme_details: Array<{
        group_id: string;
        occurrences: Array<{
            startIndex: number;
            endIndex: number;
            text: string;
        }>;
        original_rhyming_words: string[];
        pattern_description: string;
    }>;
    error?: string;
}

interface RhymeAnalysisToolProps {
    onSubmit: (text: string) => Promise<void>;
    results: AnalysisData | null;
    isLoading: boolean;
    error: string | null;
    currentCost: number;
    tokenBalance?: number;
}

const BATCH_SIZE = 1000; // Characters per batch
const DEBOUNCE_DELAY = 500; // ms

const RhymeAnalysisTool: React.FC<RhymeAnalysisToolProps> = ({
    onSubmit,
    results,
    isLoading,
    error,
    currentCost,
    tokenBalance,
}) => {
    const [text, setText] = useState('');
    const [debouncedText, setDebouncedText] = useState('');
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const [batchProgress, setBatchProgress] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Debounced text update
    const debouncedSetText = useCallback(
        debounce((value: string) => {
            setDebouncedText(value);
        }, DEBOUNCE_DELAY),
        []
    );

    useEffect(() => {
        debouncedSetText(text);
        return () => {
            debouncedSetText.cancel();
        };
    }, [text, debouncedSetText]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        // Split text into batches if it's too long
        if (text.length > BATCH_SIZE) {
            const batches = [];
            for (let i = 0; i < text.length; i += BATCH_SIZE) {
                batches.push(text.slice(i, i + BATCH_SIZE));
            }

            setBatchProgress(0);
            for (let i = 0; i < batches.length; i++) {
                await onSubmit(batches[i]);
                setBatchProgress(((i + 1) / batches.length) * 100);
            }
        } else {
            await onSubmit(text);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess('Copied to clipboard!');
            setTimeout(() => setCopySuccess(null), 2000);
        } catch (err) {
            setCopySuccess('Failed to copy');
            setTimeout(() => setCopySuccess(null), 2000);
        }
    };

    const renderResults = () => {
        if (!results) return null;

        return (
            <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                        Analysis Results
                    </Typography>
                    <Tooltip title="Copy all results">
                        <IconButton onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}>
                            <ContentCopyIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                {copySuccess && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {copySuccess}
                    </Alert>
                )}
                {results.rhyme_details.map((detail, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" component="div">
                                    Pattern {index + 1}
                                </Typography>
                                <Tooltip title="Copy this pattern">
                                    <IconButton size="small" onClick={() => copyToClipboard(JSON.stringify(detail, null, 2))}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {detail.pattern_description}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                                {detail.original_rhyming_words.map((word, wordIndex) => (
                                    <Chip
                                        key={wordIndex}
                                        label={word}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                    />
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        );
    };

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h5" gutterBottom>
                                Rhyme Analysis
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Paste your lyrics or poem below to analyze its rhyme patterns
                            </Typography>
                        </Box>

                        <TextField
                            fullWidth
                            multiline
                            rows={isMobile ? 4 : 6}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste your lyrics, poems, or any text..."
                            variant="outlined"
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                },
                            }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    {text.length} characters
                                </Typography>
                                {currentCost > 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        Cost: {currentCost} tokens
                                    </Typography>
                                )}
                            </Box>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isLoading || !text.trim()}
                                endIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                                sx={{
                                    borderRadius: 2,
                                    px: 4,
                                }}
                            >
                                {isLoading ? 'Analyzing...' : 'Break Down My Rhymes'}
                            </Button>
                        </Box>

                        {isLoading && batchProgress > 0 && (
                            <Box sx={{ width: '100%', mt: 2 }}>
                                <LinearProgress variant="determinate" value={batchProgress} />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Processing batch {Math.ceil(batchProgress / 100)} of {Math.ceil(text.length / BATCH_SIZE)}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </form>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Analysis Error</Typography>
                    <Typography>{error}</Typography>
                </Alert>
            )}

            {renderResults()}
        </Box>
    );
};

export default RhymeAnalysisTool;
