#!/usr/bin/env bash
#
# WCode CLI Installation Script
# This script creates a global 'wcode' command that can be used from anywhere
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
WCODE_SCRIPT="$WCODE_ROOT/scripts/wcode.sh"

echo -e "${BLUE}🚀 WCode CLI Installation${NC}"
echo -e "Installing WCode CLI from: ${WCODE_ROOT}"

# Check if the wcode script exists
if [ ! -f "$WCODE_SCRIPT" ]; then
    echo -e "${RED}❌ Error: WCode script not found at $WCODE_SCRIPT${NC}"
    exit 1
fi

# Make sure the script is executable
chmod +x "$WCODE_SCRIPT"

# Determine the best location for the symlink
if [ -w "/usr/local/bin" ]; then
    BIN_DIR="/usr/local/bin"
elif [ -w "$HOME/.local/bin" ]; then
    BIN_DIR="$HOME/.local/bin"
    # Make sure ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo -e "${YELLOW}⚠️  Adding $HOME/.local/bin to PATH${NC}"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc 2>/dev/null || true
    fi
else
    # Create ~/.local/bin if it doesn't exist
    mkdir -p "$HOME/.local/bin"
    BIN_DIR="$HOME/.local/bin"
    echo -e "${YELLOW}⚠️  Adding $HOME/.local/bin to PATH${NC}"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc 2>/dev/null || true
fi

WCODE_LINK="$BIN_DIR/wcode"

# Remove existing symlink if it exists
if [ -L "$WCODE_LINK" ]; then
    echo -e "${YELLOW}🔄 Removing existing wcode command${NC}"
    rm "$WCODE_LINK"
fi

# Create the symlink
echo -e "${BLUE}🔗 Creating symlink: $WCODE_LINK -> $WCODE_SCRIPT${NC}"
ln -s "$WCODE_SCRIPT" "$WCODE_LINK"

# Verify installation
if [ -x "$WCODE_LINK" ]; then
    echo -e "${GREEN}✅ WCode CLI installed successfully!${NC}"
    echo -e "${GREEN}📝 You can now use 'wcode .' to open directories with WCode${NC}"
    echo ""
    echo -e "${BLUE}Usage examples:${NC}"
    echo -e "  wcode .                    # Open current directory"
    echo -e "  wcode /path/to/project     # Open specific directory"
    echo -e "  wcode file.txt             # Open specific file"
    echo ""
    
    # Test if wcode is in PATH
    if command -v wcode >/dev/null 2>&1; then
        echo -e "${GREEN}🎉 'wcode' command is ready to use!${NC}"
    else
        echo -e "${YELLOW}⚠️  You may need to restart your terminal or run:${NC}"
        echo -e "   source ~/.bashrc"
        echo -e "   # or"
        echo -e "   source ~/.zshrc"
    fi
else
    echo -e "${RED}❌ Installation failed${NC}"
    exit 1
fi
