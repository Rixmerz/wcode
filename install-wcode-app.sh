#!/usr/bin/env bash
#
# WCode .app Installation Script for macOS
# This script installs the WCode.app to Applications folder and creates shortcuts
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the absolute path to the WCode project
WCODE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$(dirname "$WCODE_ROOT")"

echo -e "${BLUE}🚀 WCode .app Installation for macOS${NC}"
echo -e "Project root: ${WCODE_ROOT}"
echo -e "Build directory: ${BUILD_DIR}"

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    APP_DIR="$BUILD_DIR/VSCode-darwin-arm64"
    echo -e "${GREEN}📱 Detected Apple Silicon (ARM64)${NC}"
elif [ "$ARCH" = "x86_64" ]; then
    APP_DIR="$BUILD_DIR/VSCode-darwin-x64"
    echo -e "${GREEN}💻 Detected Intel (x64)${NC}"
else
    echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"
    exit 1
fi

APP_PATH="$APP_DIR/WCode - Enhanced Code Editor.app"

# Check if the app exists
if [ ! -d "$APP_PATH" ]; then
    echo -e "${RED}❌ WCode.app not found at: $APP_PATH${NC}"
    echo -e "${YELLOW}💡 Run 'npx gulp vscode-darwin-$ARCH' to build the app first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found WCode.app at: $APP_PATH${NC}"

# Install to Applications folder
APPLICATIONS_DIR="/Applications"
INSTALLED_APP_PATH="$APPLICATIONS_DIR/WCode.app"

echo -e "${BLUE}📦 Installing WCode.app to Applications folder...${NC}"

# Remove existing installation if it exists
if [ -d "$INSTALLED_APP_PATH" ]; then
    echo -e "${YELLOW}🔄 Removing existing WCode.app installation${NC}"
    rm -rf "$INSTALLED_APP_PATH"
fi

# Copy the app to Applications
cp -R "$APP_PATH" "$INSTALLED_APP_PATH"

# Verify installation
if [ -d "$INSTALLED_APP_PATH" ]; then
    echo -e "${GREEN}✅ WCode.app installed successfully!${NC}"
    echo -e "${GREEN}📱 You can now find WCode in your Applications folder${NC}"
    echo -e "${GREEN}🚀 You can also launch it from Spotlight by searching 'WCode'${NC}"
    
    # Create a symlink for command line access
    CLI_LINK="/usr/local/bin/wcode-app"
    if [ -w "/usr/local/bin" ]; then
        echo -e "${BLUE}🔗 Creating command line shortcut...${NC}"
        ln -sf "$INSTALLED_APP_PATH/Contents/MacOS/Electron" "$CLI_LINK"
        echo -e "${GREEN}✅ You can now use 'wcode-app' command from terminal${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Usage:${NC}"
    echo -e "  • Open from Applications folder"
    echo -e "  • Search 'WCode' in Spotlight"
    echo -e "  • Use 'wcode-app .' from terminal (if symlink created)"
    echo ""
    
    # Ask if user wants to open the app
    read -p "Would you like to open WCode now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Opening WCode...${NC}"
        open "$INSTALLED_APP_PATH"
    fi
    
else
    echo -e "${RED}❌ Installation failed${NC}"
    exit 1
fi
