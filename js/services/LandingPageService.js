// Landing Page Service
import { BaseService } from './BaseService.js';
import { serverTimestamp, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

class LandingPageService extends BaseService {
    constructor() {
        super();
        this.BOOK_CLUBS_COLLECTION = 'bookClubs';
    }

    async getLandingPageSettings(clubId) {
        const club = await this.getDocument(this.BOOK_CLUBS_COLLECTION, clubId);
        return club?.landingPage || this.getDefaultSettings();
    }

    async updateLandingPage(clubId, settings) {
        try {
            const validatedSettings = this.validateSettings(settings);
            const clubRef = doc(this.db, this.BOOK_CLUBS_COLLECTION, clubId);
            
            await updateDoc(clubRef, {
                landingPage: {
                    ...validatedSettings,
                    updatedAt: serverTimestamp()
                },
                updatedAt: serverTimestamp()
            });

            return validatedSettings;
        } catch (error) {
            throw this.handleError(error, 'Update Landing Page');
        }
    }

    validateSettings(settings) {
        const defaults = this.getDefaultSettings();
        const validated = { ...defaults };

        // Validate and sanitize each setting
        if (settings.welcomeMessage) {
            validated.welcomeMessage = this.sanitizeText(settings.welcomeMessage, 500);
        }

        if (settings.theme) {
            validated.theme = this.validateTheme(settings.theme);
        }

        if (settings.colors) {
            validated.colors = this.validateColors(settings.colors);
        }

        if (settings.layout) {
            validated.layout = this.validateLayout(settings.layout);
        }

        if (settings.socialLinks) {
            validated.socialLinks = this.validateSocialLinks(settings.socialLinks);
        }

        if (settings.customization) {
            validated.customization = this.validateCustomization(settings.customization);
        }

        return validated;
    }

    getDefaultSettings() {
        return {
            welcomeMessage: "Welcome to my book club!",
            theme: "default",
            colors: {
                primary: "#F58220",
                secondary: "#3A4440",
                accent: "#E0751C",
                text: "#FFFFFF",
                background: "#2F3835"
            },
            layout: {
                style: "grid", // grid, list, masonry
                showWelcome: true,
                showSocial: true,
                showStats: true
            },
            socialLinks: [],
            customization: {
                fontFamily: "Noto Sans",
                borderRadius: "rounded",
                spacing: "comfortable"
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
    }

    validateTheme(theme) {
        const validThemes = ['default', 'dark', 'light', 'minimal', 'vibrant'];
        return validThemes.includes(theme) ? theme : 'default';
    }

    validateColors(colors) {
        const validated = {};
        const hexPattern = /^#[0-9A-F]{6}$/i;

        // Validate each color is a proper hex code
        for (const [key, value] of Object.entries(colors)) {
            if (hexPattern.test(value)) {
                validated[key] = value;
            }
        }

        return {
            ...this.getDefaultSettings().colors,
            ...validated
        };
    }

    validateLayout(layout) {
        const validated = { ...this.getDefaultSettings().layout };

        if (layout.style && ['grid', 'list', 'masonry'].includes(layout.style)) {
            validated.style = layout.style;
        }

        if (typeof layout.showWelcome === 'boolean') {
            validated.showWelcome = layout.showWelcome;
        }

        if (typeof layout.showSocial === 'boolean') {
            validated.showSocial = layout.showSocial;
        }

        if (typeof layout.showStats === 'boolean') {
            validated.showStats = layout.showStats;
        }

        return validated;
    }

    validateSocialLinks(links) {
        return links
            .filter(link => {
                // Basic URL validation
                try {
                    new URL(link.url);
                    return true;
                } catch {
                    return false;
                }
            })
            .map(link => ({
                platform: this.sanitizeText(link.platform, 50),
                url: link.url,
                label: this.sanitizeText(link.label, 100)
            }));
    }

    validateCustomization(customization) {
        const validated = { ...this.getDefaultSettings().customization };

        if (customization.fontFamily) {
            const validFonts = ['Noto Sans', 'Noto Serif', 'System UI'];
            validated.fontFamily = validFonts.includes(customization.fontFamily) 
                ? customization.fontFamily 
                : 'Noto Sans';
        }

        if (customization.borderRadius) {
            const validRadii = ['none', 'rounded', 'full'];
            validated.borderRadius = validRadii.includes(customization.borderRadius)
                ? customization.borderRadius
                : 'rounded';
        }

        if (customization.spacing) {
            const validSpacing = ['compact', 'comfortable', 'spacious'];
            validated.spacing = validSpacing.includes(customization.spacing)
                ? customization.spacing
                : 'comfortable';
        }

        return validated;
    }

    sanitizeText(text, maxLength) {
        if (!text) return '';
        
        // Remove HTML tags
        text = text.replace(/<[^>]*>/g, '');
        
        // Trim whitespace
        text = text.trim();
        
        // Truncate if too long
        if (maxLength && text.length > maxLength) {
            text = text.substring(0, maxLength);
        }
        
        return text;
    }
}

// Create singleton instance
const landingPageService = new LandingPageService();
export default landingPageService;
