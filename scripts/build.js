// Build Script
import { build } from 'esbuild';
import { copy, ensureDir } from 'fs-extra';
import { join, extname } from 'path';
import { readdir } from 'fs/promises';

const BUILD_DIR = 'dist';
const ASSETS_DIR = 'assets';

async function buildProject() {
    try {
        // Build JavaScript bundles
        await build({
            entryPoints: [
                'js/services/*.js',
                'js/*.js'
            ],
            bundle: true,
            minify: true,
            sourcemap: true,
            target: ['es2020'],
            format: 'esm',
            outdir: join(BUILD_DIR, 'js'),
            loader: {
                '.js': 'jsx'
            }
        });

        // Ensure build directories exist
        await ensureDir(BUILD_DIR);

        // Copy static assets
        await copy(ASSETS_DIR, join(BUILD_DIR, ASSETS_DIR), {
            filter: (src) => !src.endsWith('.map')
        });

        // Copy HTML files
        await copy('.', BUILD_DIR, {
            filter: (src) => src.endsWith('.html')
        });

        // Copy images directory
        await copy('images', join(BUILD_DIR, 'images')).catch(() => {});

        // Copy root-level JS files that are referenced directly by HTML (e.g. forest-discovery.js)
        try {
            const rootFiles = await readdir('.');
            for (const f of rootFiles) {
                if (extname(f) === '.js' && !['server'].includes(f)) {
                    await copy(f, join(BUILD_DIR, f));
                }
            }
        } catch (_) {}

        // Copy key static files
        const staticFiles = [
            'firebase-config.js',
            'favicon.ico',
            'favicon.png',
            'robots.txt',
            'sitemap.xml'
        ];
        for (const f of staticFiles) {
            await copy(f, join(BUILD_DIR, f)).catch(() => {});
        }

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Invoke build
buildProject();
