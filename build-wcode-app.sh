#!/usr/bin/env bash
#
# WCode Complete Build Script for macOS
# This script builds the complete WCode.app for macOS
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  WCode Complete Build Script${NC}"
echo -e "${BLUE}================================${NC}"

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
echo -e "${BLUE}Step 1: Applying custom icons...${NC}"
node build/lib/wcode-icons.js

echo ""
echo -e "${BLUE}Step 2: Building WCode.app...${NC}"
echo -e "${YELLOW}⏳ This may take several minutes...${NC}"
npx gulp $BUILD_TARGET

echo ""
echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Check if the app was created
BUILD_DIR="$(dirname "$(pwd)")"
APP_PATH="$BUILD_DIR/VSCode-darwin-$ARCH/WCode - Enhanced Code Editor.app"

if [ -d "$APP_PATH" ]; then
    echo -e "${GREEN}📱 WCode.app created at: $APP_PATH${NC}"
    
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Run './install-wcode-app.sh' to install to Applications folder"
    echo -e "  2. Or open directly: open '$APP_PATH'"
    
    # Ask if user wants to install now
    echo ""
    read -p "Would you like to install WCode.app to Applications folder now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Installing WCode.app...${NC}"
        ./install-wcode-app.sh
    fi
else
    echo -e "${RED}❌ Build failed - WCode.app not found${NC}"
    exit 1
fi
