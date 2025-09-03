const fs = require('fs');
const path = require('path');

/**
 * WCode Custom Icons Handler
 * Automatically detects and copies custom icons from resources/wcode-custom-icons
 * to the appropriate platform-specific locations.
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
 * @param {string[]} preferredExtensions - Extensions in order of preference
 * @returns {string|null} - Path to the best icon file or null if none found
 */
function findBestIcon(preferredExtensions) {
    if (!fs.existsSync(CUSTOM_ICONS_DIR)) {
        console.log('📁 Custom icons directory not found, using default icons');
        return null;
    }

    const files = fs.readdirSync(CUSTOM_ICONS_DIR);
    
    // Filter image files
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

    // Return the first image file found
    return path.join(CUSTOM_ICONS_DIR, imageFiles[0]);
}

/**
 * Copy custom icon to platform-specific location
 * @param {string} platform - Platform name (linux, win32, darwin)
 */
function copyCustomIcon(platform) {
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
        // Ensure target directory exists
        const targetDir = path.dirname(config.targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Copy the custom icon
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
function applyCustomIcons() {
    console.log('🎨 WCode Custom Icons: Checking for custom icons...');
    
    let appliedCount = 0;
    for (const platform of Object.keys(PLATFORM_CONFIGS)) {
        if (copyCustomIcon(platform)) {
            appliedCount++;
        }
    }

    if (appliedCount > 0) {
        console.log(`🎉 Applied custom icons for ${appliedCount} platform(s)`);
    } else {
        console.log('📱 Using default WCode icons');
    }
}

// Export functions for use in build scripts
module.exports = {
    applyCustomIcons,
    copyCustomIcon,
    findBestIcon,
    CUSTOM_ICONS_DIR,
    PLATFORM_CONFIGS
};

// Run if called directly
if (require.main === module) {
    applyCustomIcons();
}
