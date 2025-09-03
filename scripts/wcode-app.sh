#!/usr/bin/env bash
#
# WCode Application Launcher
# This script launches the installed WCode.app from Applications
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Path to the installed WCode application
WCODE_APP="/Applications/WCode.app"
WCODE_EXECUTABLE="$WCODE_APP/Contents/MacOS/Electron"

function wcode_app() {
    # Check if WCode.app is installed
    if [ ! -d "$WCODE_APP" ]; then
        echo -e "${RED}❌ WCode.app not found in Applications folder${NC}"
        echo -e "${YELLOW}💡 Please install WCode.app first by running: ./install-wcode-app.sh${NC}"
        return 1
    fi

    # Check if the executable exists
    if [ ! -f "$WCODE_EXECUTABLE" ]; then
        echo -e "${RED}❌ WCode executable not found at: $WCODE_EXECUTABLE${NC}"
        return 1
    fi

    # If no arguments provided, open WCode without a specific folder
    if [ $# -eq 0 ]; then
        echo -e "${BLUE}🚀 Opening WCode...${NC}"
        open "$WCODE_APP"
        return 0
    fi

    # Handle special arguments
    case "$1" in
        --help|-h)
            echo -e "${BLUE}WCode Application Launcher${NC}"
            echo ""
            echo "Usage:"
            echo "  wcode                    # Open WCode"
            echo "  wcode .                  # Open current directory"
            echo "  wcode /path/to/folder    # Open specific folder"
            echo "  wcode file.txt           # Open specific file"
            echo "  wcode --help             # Show this help"
            echo ""
            return 0
            ;;
        --version|-v)
            echo -e "${BLUE}🚀 Opening WCode to check version...${NC}"
            open "$WCODE_APP" --args --version
            return 0
            ;;
    esac

    # Process arguments
    local args=()
    for arg in "$@"; do
        if [ "$arg" = "." ]; then
            # Convert current directory to absolute path
            args+=("$(pwd)")
        elif [ -e "$arg" ]; then
            # Convert relative paths to absolute paths
            if [[ "$arg" = /* ]]; then
                args+=("$arg")
            else
                args+=("$(pwd)/$arg")
            fi
        else
            # Pass other arguments as-is
            args+=("$arg")
        fi
    done

    # Launch WCode with arguments
    if [ ${#args[@]} -gt 0 ]; then
        echo -e "${BLUE}🚀 Opening WCode with: ${args[*]}${NC}"
        open "$WCODE_APP" --args "${args[@]}"
    else
        echo -e "${BLUE}🚀 Opening WCode...${NC}"
        open "$WCODE_APP"
    fi
}

function wcode_app_wsl() {
    HOST_IP=$(echo "" | powershell.exe -noprofile -Command "& {(Get-NetIPAddress | Where-Object {\$_.InterfaceAlias -like '*WSL*' -and \$_.AddressFamily -eq 'IPv4'}).IPAddress | Write-Host -NoNewline}")
    export DISPLAY="$HOST_IP:0"

    if [ -z "$DISPLAY" ]; then
        echo "WSL DISPLAY is not set, trying to start wslg service"
        wslg 2>/dev/null
        export DISPLAY=:0

        if [ -z "$DISPLAY" ]; then
            echo "If you are using WSL2 and WSLg is not available, please see https://aka.ms/vscode-wsl2-x11 for setup instructions"
            echo "If you are using WSL1, please see https://aka.ms/vscode-wsl-x11 for setup instructions"
        fi
    fi

    wcode_app "$@"
    exit $?
}

# Detect WSL
IN_WSL=false
if [ -n "${WSL_DISTRO_NAME+x}" ] || [ -n "${WSLPATH+x}" ] || [ -n "${WSLENV+x}" ]; then
    IN_WSL=true
fi

# Main execution
if [ "$IN_WSL" == "true" ] && [ -z "$DISPLAY" ]; then
    wcode_app_wsl "$@"
elif [ -f /mnt/wslg/versions.txt ]; then
    wcode_app --disable-gpu "$@"
elif [ -f /.dockerenv ]; then
    wcode_app --disable-dev-shm-usage "$@"
else
    wcode_app "$@"
fi

exit $?
