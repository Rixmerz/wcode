const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * WCode Custom Icons Handler - Fixed Version
 * Properly converts and applies custom icons with correct format handling
 */

const CUSTOM_ICONS_DIR = path.join(__dirname, '../../resources/wcode-custom-icons');
const RESOURCES_DIR = path.join(__dirname, '../../resources');

const PLATFORM_CONFIGS = {
    linux: {
        targetPath: path.join(RESOURCES_DIR, 'linux/code.png'),
        preferredExtensions: ['.png', '.jpg', '.jpeg']
    },
    win32: {
        targetPath: path.join(RESOURCES_DIR, 'win32/code.ico'),
        preferredExtensions: ['.ico', '.png', '.jpg', '.jpeg']
    },
    darwin: {
        targetPath: path.join(RESOURCES_DIR, 'darwin/code.icns'),
        preferredExtensions: ['.icns', '.png', '.jpg', '.jpeg']
    }
};

/**
 * Find the best icon file in the custom icons directory
 */
function findBestIcon(preferredExtensions) {
    if (!fs.existsSync(CUSTOM_ICONS_DIR)) {
        console.log('📁 Custom icons directory not found, using default icons');
        return null;
    }

    const files = fs.readdirSync(CUSTOM_ICONS_DIR);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.png', '.jpg', '.jpeg', '.ico', '.icns'].includes(ext);
    });

    if (imageFiles.length === 0) {
        console.log('📁 No image files found in custom icons directory');
        return null;
    }

    // Look for preferred names first
    const preferredNames = ['icon', 'wcode-icon', 'app-icon'];
    for (const name of preferredNames) {
        for (const ext of preferredExtensions) {
            const fileName = name + ext;
            if (imageFiles.includes(fileName)) {
                return path.join(CUSTOM_ICONS_DIR, fileName);
            }
        }
    }

    // Look for any file with preferred extensions
    for (const ext of preferredExtensions) {
        const file = imageFiles.find(f => path.extname(f).toLowerCase() === ext);
        if (file) {
            return path.join(CUSTOM_ICONS_DIR, file);
        }
    }

    return path.join(CUSTOM_ICONS_DIR, imageFiles[0]);
}

/**
 * Convert image to ICNS format for macOS using proper iconset approach
 */
function convertToIcns(sourcePath, targetPath) {
    return new Promise((resolve) => {
        console.log(`🔄 Converting ${path.basename(sourcePath)} to ICNS format...`);
        
        const tempDir = '/tmp';
        const iconsetName = `wcode-iconset-${Date.now()}`;
        const iconsetPath = path.join(tempDir, iconsetName + '.iconset');
        const tempPngPath = path.join(tempDir, `wcode-temp-${Date.now()}.png`);

        // Step 1: Convert to PNG first
        const convertToPng = spawn('sips', ['-s', 'format', 'png', sourcePath, '--out', tempPngPath]);
        
        convertToPng.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ Failed to convert to PNG`);
                resolve(false);
                return;
            }

            // Step 2: Create iconset
            try {
                if (fs.existsSync(iconsetPath)) {
                    fs.rmSync(iconsetPath, { recursive: true, force: true });
                }
                fs.mkdirSync(iconsetPath, { recursive: true });
            } catch (error) {
                console.error(`❌ Failed to create iconset directory:`, error.message);
                cleanup();
                resolve(false);
                return;
            }

            // Step 3: Generate all icon sizes
            const sizes = [
                { size: 16, name: 'icon_16x16.png' },
                { size: 32, name: 'icon_16x16@2x.png' },
                { size: 32, name: 'icon_32x32.png' },
                { size: 64, name: 'icon_32x32@2x.png' },
                { size: 128, name: 'icon_128x128.png' },
                { size: 256, name: 'icon_128x128@2x.png' },
                { size: 256, name: 'icon_256x256.png' },
                { size: 512, name: 'icon_256x256@2x.png' },
                { size: 512, name: 'icon_512x512.png' },
                { size: 1024, name: 'icon_512x512@2x.png' }
            ];

            let completed = 0;
            let failed = false;

            sizes.forEach(({ size, name }) => {
                const outputPath = path.join(iconsetPath, name);
                const sips = spawn('sips', ['-z', size.toString(), size.toString(), tempPngPath, '--out', outputPath]);
                
                sips.on('close', (code) => {
                    completed++;
                    if (code !== 0) failed = true;
                    
                    if (completed === sizes.length) {
                        if (failed) {
                            console.error(`❌ Failed to generate some icon sizes`);
                            cleanup();
                            resolve(false);
                            return;
                        }

                        // Step 4: Create ICNS
                        const iconutil = spawn('iconutil', ['-c', 'icns', iconsetPath, '-o', targetPath]);
                        
                        iconutil.on('close', (code) => {
                            cleanup();
                            if (code === 0) {
                                console.log(`✅ Custom icon converted and applied for darwin: ${path.basename(sourcePath)} -> ${path.basename(targetPath)}`);
                                resolve(true);
                            } else {
                                console.error(`❌ iconutil failed`);
                                resolve(false);
                            }
                        });

                        iconutil.on('error', (error) => {
                            cleanup();
                            console.error(`❌ iconutil error:`, error.message);
                            resolve(false);
                        });
                    }
                });

                sips.on('error', () => {
                    completed++;
                    failed = true;
                });
            });

            function cleanup() {
                try {
                    if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath);
                    if (fs.existsSync(iconsetPath)) fs.rmSync(iconsetPath, { recursive: true, force: true });
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        });

        convertToPng.on('error', (error) => {
            console.error(`❌ Failed to convert to PNG:`, error.message);
            resolve(false);
        });
    });
}

/**
 * Apply custom icon for a specific platform
 */
async function copyCustomIcon(platform) {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
        console.error(`❌ Unknown platform: ${platform}`);
        return false;
    }

    const customIconPath = findBestIcon(config.preferredExtensions);
    if (!customIconPath) {
        console.log(`📱 No custom icon found for ${platform}, keeping default`);
        return false;
    }

    try {
        const targetDir = path.dirname(config.targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const sourceExt = path.extname(customIconPath).toLowerCase();
        const targetExt = path.extname(config.targetPath).toLowerCase();

        // For macOS, always convert to proper ICNS
        if (platform === 'darwin' && targetExt === '.icns') {
            return await convertToIcns(customIconPath, config.targetPath);
        }

        // For other platforms, direct copy is usually fine
        fs.copyFileSync(customIconPath, config.targetPath);
        console.log(`✅ Custom icon applied for ${platform}: ${path.basename(customIconPath)} -> ${path.basename(config.targetPath)}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to copy custom icon for ${platform}:`, error.message);
        return false;
    }
}

/**
 * Apply custom icons for all platforms
 */
async function applyCustomIcons() {
    console.log('🎨 WCode Custom Icons: Checking for custom icons...');
    
    let appliedCount = 0;
    for (const platform of Object.keys(PLATFORM_CONFIGS)) {
        if (await copyCustomIcon(platform)) {
            appliedCount++;
        }
    }

    if (appliedCount > 0) {
        console.log(`🎉 Applied custom icons for ${appliedCount} platform(s)`);
    } else {
        console.log('📱 Using default WCode icons');
    }
}

module.exports = {
    applyCustomIcons,
    copyCustomIcon,
    findBestIcon,
    CUSTOM_ICONS_DIR,
    PLATFORM_CONFIGS
};

// Run if called directly
if (require.main === module) {
    applyCustomIcons().catch(console.error);
}
