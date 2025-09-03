#!/usr/bin/env bash
#
# WCode Icon Fix and Rebuild Script
# This script properly converts custom icons and rebuilds the app
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 WCode Icon Fix and Rebuild${NC}"
echo -e "${BLUE}==============================${NC}"

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    BUILD_TARGET="vscode-darwin-arm64"
    echo -e "${GREEN}📱 Building for Apple Silicon (ARM64)${NC}"
elif [ "$ARCH" = "x86_64" ]; then
    BUILD_TARGET="vscode-darwin-x64"
    echo -e "${GREEN}💻 Building for Intel (x64)${NC}"
else
    echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 1: Converting custom icons properly...${NC}"
node build/lib/wcode-icons-fixed.js

echo ""
echo -e "${BLUE}Step 2: Verifying ICNS file...${NC}"
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
echo -e "${BLUE}Step 3: Building WCode.app...${NC}"
echo -e "${YELLOW}⏳ This may take several minutes...${NC}"
npx gulp $BUILD_TARGET

echo ""
echo -e "${BLUE}Step 4: Installing to Applications...${NC}"
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
    echo -e "${BLUE}Step 5: Clearing icon cache...${NC}"
    rm -rf ~/Library/Caches/com.apple.iconservices.store 2>/dev/null || true
    killall Dock 2>/dev/null || true
    killall Finder 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}✅ WCode.app installed successfully with custom icon!${NC}"
    echo -e "${GREEN}📱 Your custom icon should now be visible in:${NC}"
    echo -e "  • Applications folder"
    echo -e "  • Spotlight search"
    echo -e "  • Dock (if added)"
    
    echo ""
    echo -e "${BLUE}💡 Tips:${NC}"
    echo -e "  • If icon doesn't appear immediately, wait a few seconds"
    echo -e "  • Try searching 'WCode' in Spotlight"
    echo -e "  • Restart if icon cache doesn't refresh"
    
    # Ask if user wants to open the app
    echo ""
    read -p "Would you like to open WCode now to test it? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Opening WCode...${NC}"
        open "$INSTALLED_APP_PATH"
    fi
    
else
    echo -e "${RED}❌ Build failed - WCode.app not found at: $APP_PATH${NC}"
    exit 1
fi
