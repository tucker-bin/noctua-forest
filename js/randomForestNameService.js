// Random Forest Name Service
// Generates unique, random Forest names for each comment/review
// This maintains privacy and authenticity by not linking names to users

const FOREST_ADJECTIVES = [
    'Whispering', 'Ancient', 'Mystic', 'Twilight', 'Starlit', 'Moonlit', 'Shadowed', 'Golden',
    'Silver', 'Crimson', 'Azure', 'Emerald', 'Amber', 'Violet', 'Copper', 'Pearl',
    'Rustic', 'Wild', 'Serene', 'Vibrant', 'Gentle', 'Fierce', 'Wise', 'Curious',
    'Dreaming', 'Wandering', 'Hidden', 'Sacred', 'Timeless', 'Ethereal', 'Grounded', 'Soaring'
];

const FOREST_NOUNS = [
    'Oak', 'Maple', 'Willow', 'Pine', 'Cedar', 'Birch', 'Elm', 'Ash',
    'Fern', 'Moss', 'Ivy', 'Vine', 'Blossom', 'Petal', 'Thorn', 'Root',
    'Stream', 'Pond', 'Spring', 'Brook', 'Cascade', 'Pool', 'River', 'Lake',
    'Stone', 'Crystal', 'Gem', 'Mineral', 'Ore', 'Quartz', 'Jade', 'Amber',
    'Owl', 'Raven', 'Sparrow', 'Finch', 'Wren', 'Thrush', 'Lark', 'Dove',
    'Deer', 'Fox', 'Wolf', 'Bear', 'Squirrel', 'Rabbit', 'Hedgehog', 'Badger'
];

const FOREST_ELEMENTS = [
    'of the Night', 'of the Dawn', 'of the Dusk', 'of the Moon', 'of the Stars',
    'of the Wind', 'of the Rain', 'of the Snow', 'of the Frost', 'of the Mist',
    'of the Forest', 'of the Grove', 'of the Wood', 'of the Thicket', 'of the Clearing',
    'of the Valley', 'of the Hill', 'of the Mountain', 'of the Peak', 'of the Ridge',
    'of the Meadow', 'of the Field', 'of the Garden', 'of the Orchard', 'of the Vineyard'
];

/**
 * Generate a random Forest name for a comment/review
 * @returns {string} A unique Forest name
 */
export function generateRandomForestName() {
    const adjective = FOREST_ADJECTIVES[Math.floor(Math.random() * FOREST_ADJECTIVES.length)];
    const noun = FOREST_NOUNS[Math.floor(Math.random() * FOREST_NOUNS.length)];
    const element = FOREST_ELEMENTS[Math.floor(Math.random() * FOREST_ELEMENTS.length)];
    
    return `${adjective} ${noun} ${element}`;
}

/**
 * Generate a shorter Forest name (without element)
 * @returns {string} A shorter Forest name
 */
export function generateShortForestName() {
    const adjective = FOREST_ADJECTIVES[Math.floor(Math.random() * FOREST_ADJECTIVES.length)];
    const noun = FOREST_NOUNS[Math.floor(Math.random() * FOREST_NOUNS.length)];
    
    return `${adjective} ${noun}`;
}

/**
 * Generate a very short Forest name (just noun)
 * @returns {string} A very short Forest name
 */
export function generateMinimalForestName() {
    const noun = FOREST_NOUNS[Math.floor(Math.random() * FOREST_NOUNS.length)];
    return noun;
}

/**
 * Generate a Forest name with a specific theme
 * @param {string} theme - 'nature', 'animals', 'elements', 'time'
 * @returns {string} A themed Forest name
 */
export function generateThemedForestName(theme = 'nature') {
    let adjective, noun, element;
    
    switch (theme) {
        case 'animals':
            adjective = FOREST_ADJECTIVES[Math.floor(Math.random() * FOREST_ADJECTIVES.length)];
            noun = FOREST_NOUNS.slice(32, 40)[Math.floor(Math.random() * 8)]; // Animal nouns
            element = FOREST_ELEMENTS[Math.floor(Math.random() * FOREST_ELEMENTS.length)];
            break;
        case 'elements':
            adjective = FOREST_ADJECTIVES[Math.floor(Math.random() * FOREST_ADJECTIVES.length)];
            noun = FOREST_NOUNS.slice(24, 32)[Math.floor(Math.random() * 8)]; // Element nouns
            element = FOREST_ELEMENTS[Math.floor(Math.random() * FOREST_ELEMENTS.length)];
            break;
        case 'time':
            adjective = FOREST_ADJECTIVES.slice(0, 8)[Math.floor(Math.random() * 8)]; // Time-related adjectives
            noun = FOREST_NOUNS[Math.floor(Math.random() * FOREST_NOUNS.length)];
            element = FOREST_ELEMENTS.slice(0, 5)[Math.floor(Math.random() * 5)]; // Time-related elements
            break;
        default: // nature
            adjective = FOREST_ADJECTIVES[Math.floor(Math.random() * FOREST_ADJECTIVES.length)];
            noun = FOREST_NOUNS.slice(0, 24)[Math.floor(Math.random() * 24)]; // Nature nouns
            element = FOREST_ELEMENTS[Math.floor(Math.random() * FOREST_ELEMENTS.length)];
    }
    
    return `${adjective} ${noun} ${element}`;
}

/**
 * Get a random Forest name with specified length preference
 * @param {string} length - 'full', 'short', 'minimal'
 * @returns {string} A Forest name of the specified length
 */
export function getForestName(length = 'full') {
    switch (length) {
        case 'short':
            return generateShortForestName();
        case 'minimal':
            return generateMinimalForestName();
        case 'full':
        default:
            return generateRandomForestName();
    }
}
