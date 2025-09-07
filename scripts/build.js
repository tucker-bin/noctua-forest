// Build Script
import { build } from 'esbuild';
import { copy } from 'fs-extra';
import { join } from 'path';

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

        // Copy static assets
        await copy(ASSETS_DIR, join(BUILD_DIR, ASSETS_DIR), {
            filter: (src) => !src.endsWith('.map')
        });

        // Copy HTML files
        await copy('.', BUILD_DIR, {
            filter: (src) => src.endsWith('.html')
        });

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}
