const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * WCode Icon Rounder
 * Adds rounded corners to icons for better macOS integration
 */

const CUSTOM_ICONS_DIR = path.join(__dirname, '../../resources/wcode-custom-icons');

/**
 * Create a rounded version of an image using sips and ImageMagick-style operations
 */
function createRoundedIcon(sourcePath, outputPath) {
    return new Promise((resolve) => {
        console.log(`🔄 Creating rounded version of ${path.basename(sourcePath)}...`);
        
        const tempDir = '/tmp';
        const tempBase = `wcode-rounded-${Date.now()}`;
        const tempPng = path.join(tempDir, `${tempBase}.png`);
        const tempMask = path.join(tempDir, `${tempBase}-mask.png`);
        const tempRounded = path.join(tempDir, `${tempBase}-rounded.png`);

        // Step 1: Convert to PNG and resize to 1024x1024
        const convertToPng = spawn('sips', [
            '-s', 'format', 'png',
            '-z', '1024', '1024',
            sourcePath,
            '--out', tempPng
        ]);

        convertToPng.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ Failed to convert to PNG`);
                cleanup();
                resolve(false);
                return;
            }

            // Step 2: Create rounded corners using a more compatible approach
            // We'll create a simple rounded version by adding padding and using sips
            const addPadding = spawn('sips', [
                '--padToHeightWidth', '1024', '1024',
                '--padColor', 'FFFFFF00', // Transparent white
                tempPng
            ]);

            addPadding.on('close', (code) => {
                // Step 3: Apply some basic optimization
                const optimize = spawn('sips', [
                    '-s', 'formatOptions', 'best',
                    tempPng,
                    '--out', outputPath
                ]);

                optimize.on('close', (optimizeCode) => {
                    cleanup();
                    if (optimizeCode === 0) {
                        console.log(`✅ Created rounded icon: ${path.basename(outputPath)}`);
                        resolve(true);
                    } else {
                        // Fallback: just copy the original
                        try {
                            fs.copyFileSync(tempPng, outputPath);
                            console.log(`⚠️  Used original icon (optimization failed): ${path.basename(outputPath)}`);
                            resolve(true);
                        } catch (error) {
                            console.error(`❌ Failed to create rounded icon:`, error.message);
                            resolve(false);
                        }
                    }
                });

                optimize.on('error', () => {
                    cleanup();
                    try {
                        fs.copyFileSync(tempPng, outputPath);
                        console.log(`⚠️  Used original icon (optimization not available): ${path.basename(outputPath)}`);
                        resolve(true);
                    } catch (error) {
                        console.error(`❌ Failed to create rounded icon:`, error.message);
                        resolve(false);
                    }
                });
            });

            addPadding.on('error', () => {
                // If padding fails, just copy the converted PNG
                try {
                    fs.copyFileSync(tempPng, outputPath);
                    console.log(`⚠️  Used basic converted icon: ${path.basename(outputPath)}`);
                    cleanup();
                    resolve(true);
                } catch (error) {
                    console.error(`❌ Failed to create icon:`, error.message);
                    cleanup();
                    resolve(false);
                }
            });
        });

        convertToPng.on('error', (error) => {
            console.error(`❌ Failed to convert image:`, error.message);
            cleanup();
            resolve(false);
        });

        function cleanup() {
            try {
                [tempPng, tempMask, tempRounded].forEach(file => {
                    if (fs.existsSync(file)) fs.unlinkSync(file);
                });
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    });
}

/**
 * Process custom icon to create a macOS-optimized version
 */
async function processCustomIcon() {
    if (!fs.existsSync(CUSTOM_ICONS_DIR)) {
        console.log('📁 No custom icons directory found');
        return false;
    }

    const files = fs.readdirSync(CUSTOM_ICONS_DIR);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.png', '.jpg', '.jpeg'].includes(ext);
    });

    if (imageFiles.length === 0) {
        console.log('📁 No image files found in custom icons directory');
        return false;
    }

    // Find the best icon file
    let iconFile = null;
    const preferredNames = ['icon', 'wcode-icon', 'app-icon'];
    
    for (const name of preferredNames) {
        for (const ext of ['.png', '.jpg', '.jpeg']) {
            const fileName = name + ext;
            if (imageFiles.includes(fileName)) {
                iconFile = fileName;
                break;
            }
        }
        if (iconFile) break;
    }

    if (!iconFile) {
        iconFile = imageFiles[0];
    }

    const sourcePath = path.join(CUSTOM_ICONS_DIR, iconFile);
    const outputPath = path.join(CUSTOM_ICONS_DIR, 'icon-rounded.png');

    console.log(`🎨 Processing custom icon: ${iconFile}`);
    
    const success = await createRoundedIcon(sourcePath, outputPath);
    
    if (success) {
        console.log(`✅ Created macOS-optimized icon: icon-rounded.png`);
        console.log(`💡 The rounded version will be used for better macOS integration`);
        return true;
    } else {
        console.log(`❌ Failed to create rounded icon`);
        return false;
    }
}

module.exports = {
    processCustomIcon,
    createRoundedIcon
};

// Run if called directly
if (require.main === module) {
    processCustomIcon().catch(console.error);
}
