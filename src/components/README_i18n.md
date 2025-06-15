# Translation Guide

## Overview
This project uses `react-i18next` for internationalization. All translations are stored in JSON files located in the `src/locales` directory, with separate files for each language.

## Adding a New Language
1. Create a new directory under `src/locales` for the language code (e.g., `fr` for French).
2. Add a `translation.json` file in the new directory with the necessary translation keys and values.
3. Import the new translation file in `src/i18n.ts` and add it to the `resources` object.

## Modifying Translations
- **Every new translation key must be added to every language file.**
- Edit the `translation.json` files in the `src/locales` directory to update or add new translation keys and values.
- Ensure all components use the `useTranslation` hook to access translations.

## Using Translations in Components
- Import the `useTranslation` hook from `react-i18next`.
- Use the `t` function to access translation keys, e.g., `t('welcome')`.

## Language Switcher
The `LanguageSwitcher` component allows users to switch between available languages. Ensure it is included in your application to enable language switching.

## Best Practices
- Keep translation keys consistent across all languages.
- Use namespaces for large-scale support.
- Add tooltips and feedback prompts for key actions, and make them translatable.
- Use locale-aware date and number formatting for all user-facing data.
- RTL (right-to-left) languages are automatically supported; test your UI in RTL mode for visual correctness.
- Consider using professional or community translation tools for accuracy. 