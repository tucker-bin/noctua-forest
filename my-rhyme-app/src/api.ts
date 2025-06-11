export interface Pattern {
    phonetic_link_id: string;
    pattern_description: string;
    segments: Array<{
        globalStartIndex: number;
        globalEndIndex: number;
        text: string;
    }>;
}

export interface AnalysisData {
    original_text: string;
    rhyme_details: Pattern[];
}

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const analyzeText = async (text: string): Promise<AnalysisData> => {
    try {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                rhyme_scheme: 'phonetic_architecture'
            }),
        });

        if (!response.ok) {
            let errorMessage = 'Failed to analyze text';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                errorMessage = `${errorMessage} (Status: ${response.status})`;
            }
            
            if (response.status === 429) {
                errorMessage = 'You are sending requests too quickly. Please wait and try again.';
            } else if (response.status === 400) {
                errorMessage = 'Invalid input: Please check your text and try again.';
            } else if (response.status >= 500) {
                errorMessage = 'Server error: Our analysis engine is having trouble. Please try again later.';
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return {
            original_text: text,
            rhyme_details: data
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error('An unknown error occurred during analysis.');
        }
    }
}; 