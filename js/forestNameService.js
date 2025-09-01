// Forest Name Generator Service
// Provides unique, thematic usernames for the Noctua Forest community

const wordPools = {
    // Nature-themed adjectives
    mystical: [
        'Silent', 'Shadowy', 'Moonlit', 'Whispering', 'Ancient', 'Hooting', 'Nocturnal',
        'Hidden', 'Wandering', 'Sleeping', 'Dreaming', 'Fading', 'Twilight', 'Murmuring',
        'Glimmering', 'Starlit', 'Drowsy', 'Misty', 'Creeping', 'Howling'
    ],
    elemental: [
        'Dewy', 'Mossy', 'Foggy', 'Stormy', 'Windy', 'Icy', 'Frosty',
        'Snowy', 'Rainy', 'Sunny', 'Cloudy', 'Misty', 'Breezy', 'Dusty'
    ],
    seasonal: [
        'Autumn', 'Winter', 'Spring', 'Summer', 'Vernal', 'Hibernal',
        'Solstice', 'Dawn', 'Dusk', 'Midnight', 'Twilight', 'Eclipse'
    ],
    colors: [
        'Golden', 'Silver', 'Copper', 'Azure', 'Crimson', 'Emerald',
        'Amber', 'Indigo', 'Violet', 'Russet', 'Ochre', 'Sage'
    ],

    // Forest creatures and elements
    fauna: [
        'Owl', 'Fox', 'Badger', 'Moth', 'Fawn', 'Wolf', 'Raven',
        'Hawk', 'Deer', 'Bear', 'Hare', 'Lynx', 'Vole', 'Wren',
        'Crow', 'Elk', 'Dove', 'Swan', 'Finch', 'Thrush'
    ],
    flora: [
        'Fern', 'Moss', 'Thicket', 'Grove', 'Bramble', 'Willow',
        'Oak', 'Pine', 'Birch', 'Maple', 'Cedar', 'Aspen', 'Elm',
        'Hazel', 'Rowan', 'Alder', 'Juniper', 'Spruce', 'Hemlock'
    ],
    landscape: [
        'Creek', 'Stone', 'Branch', 'Hollow', 'River', 'Glen',
        'Vale', 'Ridge', 'Peak', 'Dale', 'Path', 'Trail', 'Brook',
        'Stream', 'Meadow', 'Glade', 'Forest', 'Wood', 'Copse'
    ],
    ethereal: [
        'Firefly', 'Wisp', 'Spore', 'Spirit', 'Ghost', 'Shadow',
        'Light', 'Spark', 'Flame', 'Ember', 'Mist', 'Shade', 'Echo'
    ]
};

// Track used names for uniqueness checking
let usedNames = new Set();

/**
 * Initialize the service with existing names
 * @param {Set<string>} existingNames - Set of names already in use
 */
export function initializeUsedNames(existingNames) {
    usedNames = new Set(existingNames);
}

/**
 * Get a random item from an array
 * @param {Array} array - Array to pick from
 * @returns {string} Random item
 */
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a unique forest name
 * @param {number} maxAttempts - Maximum number of attempts to generate unique name
 * @returns {string|null} Unique forest name or null if maxAttempts reached
 */
export function generateUniqueName(maxAttempts = 100) {
    for (let i = 0; i < maxAttempts; i++) {
        // Pick random categories for variety
        const adjectiveCategory = getRandomItem(Object.keys(wordPools).filter(k => 
            ['mystical', 'elemental', 'seasonal', 'colors'].includes(k)));
        const nounCategory = getRandomItem(Object.keys(wordPools).filter(k => 
            ['fauna', 'flora', 'landscape', 'ethereal'].includes(k)));

        const adjective = getRandomItem(wordPools[adjectiveCategory]);
        const noun = getRandomItem(wordPools[nounCategory]);
        
        const name = `${adjective}${noun}`;
        
        if (!usedNames.has(name)) {
            usedNames.add(name);
            return name;
        }
    }
    return null; // Could not generate unique name
}

/**
 * Check if a forest name is available
 * @param {string} name - Name to check
 * @returns {boolean} True if name is available
 */
export function isNameAvailable(name) {
    return !usedNames.has(name);
}

/**
 * Reserve a specific forest name
 * @param {string} name - Name to reserve
 * @returns {boolean} True if successfully reserved
 */
export function reserveName(name) {
    if (isNameAvailable(name)) {
        usedNames.add(name);
        return true;
    }
    return false;
}

/**
 * Release a forest name back into the pool
 * @param {string} name - Name to release
 */
export function releaseName(name) {
    usedNames.delete(name);
}

/**
 * Get all adjective categories
 * @returns {string[]} Array of adjective category names
 */
export function getAdjectiveCategories() {
    return ['mystical', 'elemental', 'seasonal', 'colors'];
}

/**
 * Get all noun categories
 * @returns {string[]} Array of noun category names
 */
export function getNounCategories() {
    return ['fauna', 'flora', 'landscape', 'ethereal'];
}

/**
 * Get words from a specific category
 * @param {string} category - Category name
 * @returns {string[]|null} Array of words or null if category doesn't exist
 */
export function getWordsInCategory(category) {
    return wordPools[category] || null;
}

/**
 * Calculate total possible combinations
 * @returns {number} Total possible unique names
 */
export function getTotalPossibleNames() {
    const adjCount = Object.keys(wordPools)
        .filter(k => ['mystical', 'elemental', 'seasonal', 'colors'].includes(k))
        .reduce((sum, k) => sum + wordPools[k].length, 0);
    
    const nounCount = Object.keys(wordPools)
        .filter(k => ['fauna', 'flora', 'landscape', 'ethereal'].includes(k))
        .reduce((sum, k) => sum + wordPools[k].length, 0);
    
    return adjCount * nounCount;
}
