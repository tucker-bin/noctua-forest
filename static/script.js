document.addEventListener('DOMContentLoaded', () => {
    console.log("SCRIPT.JS: DOMContentLoaded event fired.");

    const textInput = document.getElementById('textInput');
    const geniusUrlInput = document.getElementById('geniusUrlInput');
    const findRhymesButton = document.getElementById('findRhymesButton');
    const resultArea = document.getElementById('resultArea');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessageDiv = document.getElementById('errorMessage');
    const rhymeSchemeSelect = document.getElementById('rhymeScheme');

    const toggleTextButton = document.getElementById('toggleText');
    const toggleUrlButton = document.getElementById('toggleUrl');
    const textInputArea = document.getElementById('textInputArea');
    const urlInputArea = document.getElementById('urlInputArea');

    let currentInputMethod = 'text';

    // Debugging: Check if all essential elements are found
    const elements = { textInput, geniusUrlInput, findRhymesButton, resultArea, loadingIndicator, loadingMessage, errorMessageDiv, rhymeSchemeSelect, toggleTextButton, toggleUrlButton, textInputArea, urlInputArea };
    let allElementsFound = true;
    for (const elName in elements) {
        if (elements[elName]) {
            console.log(`SCRIPT.JS: ${elName} element: Found`);
        } else {
            console.warn(`SCRIPT.JS: ${elName} element: NOT FOUND (Check HTML ID: ${elName})`);
            allElementsFound = false; // Mark that at least one element is missing
        }
    }

    if (!allElementsFound) { // Simplified check based on the loop above
        console.error("SCRIPT.JS: CRITICAL - One or more core UI elements NOT found! App may not function. Check HTML IDs and JS getElementById calls.");
        if (errorMessageDiv) { // Check if errorMessageDiv itself was found before trying to use it
            errorMessageDiv.textContent = "Error: Core UI elements missing. Please refresh or contact support if the issue persists.";
            errorMessageDiv.style.display = 'block';
        }
        return; // Stop script execution if essential elements are missing
    }

    toggleTextButton.addEventListener('click', () => {
        textInputArea.style.display = 'block';
        urlInputArea.style.display = 'none';
        toggleTextButton.classList.add('active');
        toggleUrlButton.classList.remove('active');
        currentInputMethod = 'text';
        textInput.value = ''; // textInput is confirmed to exist from the check above
    });

    toggleUrlButton.addEventListener('click', () => {
        textInputArea.style.display = 'none';
        urlInputArea.style.display = 'block';
        toggleTextButton.classList.remove('active');
        toggleUrlButton.classList.add('active');
        currentInputMethod = 'url';
        geniusUrlInput.value = ''; // geniusUrlInput is confirmed to exist
    });


    findRhymesButton.addEventListener('click', async () => {
        console.log("SCRIPT.JS: 'Find Rhymes' button clicked!");
        let inputText = "";
        let inputUrl = "";
        // rhymeSchemeSelect is confirmed to exist
        const rhymeScheme = rhymeSchemeSelect.value;

        if (currentInputMethod === 'text') {
            // textInput is confirmed to exist
            inputText = textInput.value.trim();
            if (!inputText) {
                displayError("Please enter some text.");
                return;
            }
        } else {
            // geniusUrlInput is confirmed to exist
            inputUrl = geniusUrlInput.value.trim();
            if (!inputUrl) {
                displayError("Please enter a Genius.com URL.");
                return;
            }
            // Basic URL validation
            try {
                const parsedUrl = new URL(inputUrl); // Check if it's a valid URL structure
                if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                    displayError("Invalid URL protocol. Please include http:// or https://");
                    return;
                }
                if (parsedUrl.hostname !== 'genius.com' && !parsedUrl.hostname.endsWith('.genius.com')) {
                     displayError("Please enter a valid Genius.com URL (e.g., https://genius.com/...).");
                     return;
                }
            } catch (e) {
                displayError("Invalid URL format. Please enter a valid Genius.com URL.");
                return;
            }
        }

        console.log("SCRIPT.JS: Input Text:", inputText ? inputText.substring(0, 50) + '...' : 'N/A');
        console.log("SCRIPT.JS: Input URL:", inputUrl);
        console.log("SCRIPT.JS: Rhyme Scheme:", rhymeScheme);

        // loadingIndicator and loadingMessage are confirmed to exist
        loadingIndicator.style.display = 'flex';
        let LMessage = "Analyzing text...";
        if (inputUrl) LMessage = "Fetching and analyzing lyrics...";
        if (rhymeScheme === "combined_all") LMessage += " (Combined Analysis)";
        
        loadingMessage.textContent = LMessage;

        // resultArea and errorMessageDiv are confirmed to exist
        resultArea.innerHTML = '';
        errorMessageDiv.style.display = 'none';

        try {
            console.log("SCRIPT.JS: Attempting to fetch /analyze...");
            const payload = {
                text: inputText,
                url: inputUrl,
                rhyme_scheme: rhymeScheme
            };
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            console.log("SCRIPT.JS: Fetch response received, status:", response.status);

            if (!response.ok) {
                let errorDetail = `Server error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorData.error || `Server error: ${response.status}. Response: ${JSON.stringify(errorData)}`;
                } catch (e) { 
                    // If response is not JSON or another error occurs during parsing
                    errorDetail = `Server error: ${response.status} ${response.statusText}. Could not parse error response.`;
                }
                console.error("SCRIPT.JS: Server responded with an error:", errorDetail);
                throw new Error(errorDetail);
            }

            const data = await response.json();
            console.log("SCRIPT.JS: Data from server:", data);
            if (data.error) {
                displayError(data.error);
            } else if (data.original_text !== undefined && data.rhyme_details !== undefined) {
                displayResults(data.original_text, data.rhyme_details);
            } else {
                displayError("Received unexpected data structure from server. Check console for details.");
                console.warn("SCRIPT.JS: Unexpected server data structure:", data);
            }

        } catch (error) {
            console.error('SCRIPT.JS: Error during fetch or processing:', error);
            // Display the actual error message to the user for better feedback
            displayError(`An error occurred: ${error.message}. Check the console for more details.`);
        } finally {
            // loadingIndicator is confirmed to exist
            loadingIndicator.style.display = 'none';
        }
    });

    function displayResults(originalText, rhymeDetails) {
        console.log("SCRIPT.JS: displayResults called.");
        // resultArea is confirmed to exist

        if (!rhymeDetails || rhymeDetails.length === 0) {
            resultArea.textContent = originalText + "\n\n(No rhymes found or an issue with analysis.)";
            if (originalText.length === 0 && currentInputMethod === 'url') {
                resultArea.textContent = "(Could not extract lyrics from the provided URL, or the lyrics page was empty.)";
            }
            return;
        }

        let highlightedText = "";
        let lastIndex = 0;
        const allWords = [];

        rhymeDetails.forEach((group, index) => {
            if (group && Array.isArray(group.occurrences)) {
                group.occurrences.forEach(occ => {
                    if (typeof occ.startIndex === 'number' && typeof occ.endIndex === 'number' && typeof occ.text === 'string') {
                        // Attempt to get a numeric part from group_id for consistent coloring
                        let groupIdentifier = group.group_id ? String(group.group_id).match(/\d+$/) : null;
                        let numericIndex = groupIdentifier ? parseInt(groupIdentifier[0], 10) : index;
                        // Fallback if parsing failed or group_id was not as expected
                        if (isNaN(numericIndex)) {
                            numericIndex = index;
                        }
                        allWords.push({ ...occ, groupIndex: numericIndex });
                    } else {
                        console.warn("SCRIPT.JS: Invalid occurrence object in rhymeDetails:", occ);
                    }
                });
            } else {
                console.warn("SCRIPT.JS: Invalid or missing 'occurrences' in rhymeDetails group:", group);
            }
        });

        allWords.sort((a, b) => a.startIndex - b.startIndex);

        allWords.forEach(wordInfo => {
            highlightedText += escapeHtml(originalText.substring(lastIndex, wordInfo.startIndex));
            const highlightClass = `highlight rhyme-group-${wordInfo.groupIndex % 8}`; // Cycle through 8 colors
            highlightedText += `<span class="${highlightClass}">${escapeHtml(wordInfo.text)}</span>`;
            lastIndex = wordInfo.endIndex;
        });

        highlightedText += escapeHtml(originalText.substring(lastIndex));
        resultArea.innerHTML = highlightedText;
    }

    function displayError(message) {
        console.log("SCRIPT.JS: displayError called with message:", message);
        // errorMessageDiv is confirmed to exist
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
        // resultArea is confirmed to exist
        resultArea.innerHTML = '';
    }

    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return unsafe
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, """)
            .replace(/'/g, "'");
}
console.log("SCRIPT.JS: Script finished loading and all event listeners attached."); // Line 226
}); // Line 227 - cursor should be here, nothing after -> |