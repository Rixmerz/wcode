#!/usr/bin/env bash
#
# WCode CLI Script
# This script allows you to run WCode from the command line using 'wcode' command
#

# Get the absolute path to the WCode project root
SCRIPT_PATH="$0"
if [ -L "$SCRIPT_PATH" ]; then
    # If this is a symlink, resolve it
    if [[ "$OSTYPE" == "darwin"* ]]; then
        SCRIPT_PATH=$(readlink "$SCRIPT_PATH")
    else
        SCRIPT_PATH=$(readlink -f "$SCRIPT_PATH")
    fi
fi

# Get the directory containing the script, then go up to project root
SCRIPT_DIR=$(dirname "$SCRIPT_PATH")
ROOT=$(dirname "$SCRIPT_DIR")

function wcode() {
	cd "$ROOT"

	if [[ "$OSTYPE" == "darwin"* ]]; then
		NAME=`node -p "require('./product.json').nameLong"`
		WCODE="./.build/electron/$NAME.app/Contents/MacOS/Electron"
	else
		NAME=`node -p "require('./product.json').applicationName"`
		WCODE=".build/electron/$NAME"
	fi

	# Get electron, compile, built-in extensions
	if [[ -z "${VSCODE_SKIP_PRELAUNCH}" ]]; then
		node build/lib/preLaunch.js
	fi

	# Manage built-in extensions
	if [[ "$1" == "--builtin" ]]; then
		exec "$WCODE" build/builtin
		return
	fi

	# Configuration
	export NODE_ENV=development
	export VSCODE_DEV=1
	export VSCODE_CLI=1
	export ELECTRON_ENABLE_STACK_DUMPING=1
	export ELECTRON_ENABLE_LOGGING=1

	DISABLE_TEST_EXTENSION="--disable-extension=vscode.vscode-api-tests"
	if [[ "$@" == *"--extensionTestsPath"* ]]; then
		DISABLE_TEST_EXTENSION=""
	fi

	# Launch WCode
	exec "$WCODE" . $DISABLE_TEST_EXTENSION "$@"
}

function wcode-wsl()
{
	HOST_IP=$(echo "" | powershell.exe -noprofile -Command "& {(Get-NetIPAddress | Where-Object {\$_.InterfaceAlias -like '*WSL*' -and \$_.AddressFamily -eq 'IPv4'}).IPAddress | Write-Host -NoNewline}")
	export DISPLAY="$HOST_IP:0"

	# in a wsl shell
	if [ -z "$DISPLAY" ]; then
		echo "WSL DISPLAY is not set, trying to start wslg service"
		wslg 2>/dev/null
		export DISPLAY=:0

		if [ -z "$DISPLAY" ]; then
			echo "If you are using WSL2 and WSLg is not available, please see https://aka.ms/vscode-wsl2-x11 for setup instructions"
			echo "If you are using WSL1, please see https://aka.ms/vscode-wsl-x11 for setup instructions"
		fi
	fi

	wcode "$@"
	exit $?
}

IN_WSL=false
if [ -n "${WSL_DISTRO_NAME+x}" ] || [ -n "${WSLPATH+x}" ] || [ -n "${WSLENV+x}" ]; then
	IN_WSL=true
fi

if [ "$IN_WSL" == "true" ] && [ -z "$DISPLAY" ]; then
	wcode-wsl "$@"
elif [ -f /mnt/wslg/versions.txt ]; then
	wcode --disable-gpu "$@"
elif [ -f /.dockerenv ]; then
	# Workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=1263267
	# Chromium does not release shared memory when streaming scripts
	# which might exhaust the available resources in the container environment
	# leading to failed script loading.
	wcode --disable-dev-shm-usage "$@"
else
	wcode "$@"
fi

exit $?
