#!/usr/bin/env bash
#
# WCode Complete Fix Script
# Fixes both icon issues (rounded corners) and CLI command issues
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 WCode Complete Fix${NC}"
echo -e "${BLUE}=====================${NC}"
echo -e "This script will fix:"
echo -e "  • Icon rounded corners for better macOS integration"
echo -e "  • CLI command to use installed app instead of dev version"
echo ""

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    BUILD_TARGET="vscode-darwin-arm64"
    echo -e "${GREEN}📱 Detected Apple Silicon (ARM64)${NC}"
elif [ "$ARCH" = "x86_64" ]; then
    BUILD_TARGET="vscode-darwin-x64"
    echo -e "${GREEN}💻 Detected Intel (x64)${NC}"
else
    echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 1: Creating rounded icon version...${NC}"
node build/lib/wcode-icon-rounder.js

echo ""
echo -e "${BLUE}Step 2: Converting icons with rounded version...${NC}"
node build/lib/wcode-icons-fixed.js

echo ""
echo -e "${BLUE}Step 3: Verifying ICNS file...${NC}"
if [ -f "resources/darwin/code.icns" ]; then
    FILE_TYPE=$(file resources/darwin/code.icns)
    if [[ $FILE_TYPE == *"Mac OS X icon"* ]]; then
        echo -e "${GREEN}✅ ICNS file is valid${NC}"
    else
        echo -e "${RED}❌ ICNS file is not valid: $FILE_TYPE${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ ICNS file not found${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 4: Updating CLI command...${NC}"
# Update the wcode command to use the app version
if [ -f ~/.local/bin/wcode ]; then
    rm -f ~/.local/bin/wcode
fi
ln -s "$(pwd)/scripts/wcode-app.sh" ~/.local/bin/wcode
echo -e "${GREEN}✅ CLI command updated to use installed app${NC}"

echo ""
echo -e "${BLUE}Step 5: Building WCode.app...${NC}"
echo -e "${YELLOW}⏳ This may take several minutes...${NC}"
npx gulp $BUILD_TARGET

echo ""
echo -e "${BLUE}Step 6: Installing to Applications...${NC}"
BUILD_DIR="$(dirname "$(pwd)")"
APP_PATH="$BUILD_DIR/VSCode-darwin-$ARCH/WCode - Enhanced Code Editor.app"
INSTALLED_APP_PATH="/Applications/WCode.app"

if [ -d "$APP_PATH" ]; then
    echo -e "${GREEN}✅ WCode.app built successfully${NC}"
    
    # Remove existing installation
    if [ -d "$INSTALLED_APP_PATH" ]; then
        echo -e "${YELLOW}🔄 Removing existing installation${NC}"
        rm -rf "$INSTALLED_APP_PATH"
    fi
    
    # Install new version
    echo -e "${BLUE}📦 Installing WCode.app to Applications${NC}"
    cp -R "$APP_PATH" "$INSTALLED_APP_PATH"
    
    echo ""
    echo -e "${BLUE}Step 7: Clearing icon cache and refreshing system...${NC}"
    rm -rf ~/Library/Caches/com.apple.iconservices.store 2>/dev/null || true
    sudo rm -rf /Library/Caches/com.apple.iconservices.store 2>/dev/null || true
    killall Dock 2>/dev/null || true
    killall Finder 2>/dev/null || true
    
    # Force icon refresh
    touch "$INSTALLED_APP_PATH"
    
    echo ""
    echo -e "${GREEN}✅ WCode.app installed successfully!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Fixes Applied:${NC}"
    echo -e "  ✅ Icon now has proper rounded corners for macOS"
    echo -e "  ✅ CLI command 'wcode .' now opens the installed app"
    echo -e "  ✅ Icon cache cleared for immediate visibility"
    
    echo ""
    echo -e "${BLUE}📱 Your WCode app is now available in:${NC}"
    echo -e "  • Applications folder (with rounded icon)"
    echo -e "  • Spotlight search"
    echo -e "  • Dock (if added)"
    
    echo ""
    echo -e "${BLUE}🚀 CLI Usage:${NC}"
    echo -e "  wcode .                  # Opens current directory in WCode app"
    echo -e "  wcode /path/to/project   # Opens specific directory"
    echo -e "  wcode file.txt           # Opens specific file"
    echo -e "  wcode --help             # Shows help"
    
    echo ""
    echo -e "${BLUE}💡 Tips:${NC}"
    echo -e "  • Icon changes may take a few seconds to appear"
    echo -e "  • Try adding WCode to your Dock for quick access"
    echo -e "  • The rounded corners should now match other macOS apps"
    
    # Test the CLI command
    echo ""
    echo -e "${BLUE}🧪 Testing CLI command...${NC}"
    if command -v wcode >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 'wcode' command is working!${NC}"
        
        # Ask if user wants to test it
        read -p "Would you like to test 'wcode .' now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}🚀 Testing wcode command...${NC}"
            wcode .
        fi
    else
        echo -e "${YELLOW}⚠️  You may need to restart your terminal for 'wcode' command to work${NC}"
    fi
    
else
    echo -e "${RED}❌ Build failed - WCode.app not found at: $APP_PATH${NC}"
    exit 1
fi
