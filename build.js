import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

const buildOptions = {
    target: 'es2020',
    format: 'iife',
    logLevel: 'info',
    sourcemap: 'linked'
};

try {
    console.log('🔨 Building FixMyPrompt v0.1.4...\n');

    // Build content script
    console.log('📝 Building content-script.js...');
    await esbuild.build({
        entryPoints: ['src/content/index.js'],
        bundle: true,
        outfile: 'dist/content-script.js',
        minify: true,
        ...buildOptions
    });

    // Build service worker
    console.log('📝 Building service-worker.js...');
    await esbuild.build({
        entryPoints: ['src/background/service-worker.js'],
        bundle: true,
        outfile: 'dist/service-worker.js',
        minify: true,
        ...buildOptions
    });

    // Copy CSS
    console.log('📝 Copying extension.css...');
    fs.copyFileSync('extension.css', 'dist/extension.css');

    // Copy manifest
    console.log('📝 Copying manifest.json...');
    fs.copyFileSync('manifest.json', 'dist/manifest.json');

    console.log('\n✅ Build complete!\n');

    // Print file sizes
    console.log('📊 Output file sizes:');
    const files = [
        'dist/content-script.js',
        'dist/service-worker.js',
        'dist/extension.css',
        'dist/manifest.json'
    ];
    let totalSize = 0;
    files.forEach(file => {
        if (fs.existsSync(file)) {
            const size = fs.statSync(file).size;
            const sizeKB = (size / 1024).toFixed(1);
            console.log(`  ${path.basename(file)}: ${sizeKB} KB (${size} bytes)`);
            totalSize += size;
        }
    });
    console.log(`\n  Total: ${(totalSize / 1024).toFixed(1)} KB\n`);

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
