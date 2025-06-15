export interface Pattern {
    phonetic_link_id: string;
    pattern_description: string;
    acoustic_features?: {
        primary_feature?: string;
        secondary_features?: string[];
        ipa_notation?: string;
    };
    segments: Array<{
        globalStartIndex: number;
        globalEndIndex: number;
        text: string;
        phonetic_context?: string;
        source_word?: string;
    }>;
}

export interface AnalysisData {
    original_text: string;
    rhyme_details: Pattern[];
}

// Correctly determine API URL for development and production
const API_BASE_URL = import.meta.env.DEV 
    ? 'http://localhost:3001/api' 
    : '/api';

export const analyzeText = async (text: string): Promise<AnalysisData> => {
    try {
        const response = await fetch(`${API_BASE_URL}/observe`, {
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

        const patterns = await response.json();
        
        // The backend returns either an array of patterns directly or an object with patterns property
        let rhymeDetails: Pattern[] = [];
        
        if (Array.isArray(patterns)) {
            rhymeDetails = patterns;
        } else if (patterns && patterns.patterns && Array.isArray(patterns.patterns)) {
            rhymeDetails = patterns.patterns;
        }
        
        return {
            original_text: text,
            rhyme_details: rhymeDetails
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error('An unknown error occurred during analysis.');
        }
    }
}; 