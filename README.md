# WCode - Enhanced Code Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/Rixmerz/wcode)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Rixmerz/wcode)

**WCode** is a powerful, customizable fork of Visual Studio Code with enhanced features for modern developers. Built on the solid foundation of VSCode, WCode adds native transparency control, custom backgrounds, and improved user experience while maintaining full compatibility with VSCode extensions.

## ✨ Key Features

- 🎨 **Native Window Transparency** - Built-in transparency controls without extensions
- 🖼️ **Custom Backgrounds** - Set custom backgrounds for editor and global window
- 🎯 **Custom Icons** - Easy icon customization system
- 🚀 **CLI Integration** - `wcode .` command for quick project opening
- 🔌 **Full Extension Compatibility** - Access to the complete VSCode marketplace
- 🎪 **Enhanced UI** - Improved visual experience with modern design elements

## 🚀 Quick Start

### Option 1: Download Pre-built Releases (Recommended)

**Coming Soon**: Pre-built releases for all platforms will be available in the [Releases](https://github.com/Rixmerz/wcode/releases) section.

### Option 2: Build from Source

Clone the repository and build WCode for your platform:

```bash
git clone https://github.com/Rixmerz/wcode.git
cd wcode
npm install
```

## 📦 Installation by Platform

### 🍎 macOS

#### Method 1: Automated Build and Install
```bash
# Build and install WCode.app
./build-wcode-app.sh

# Or use the complete fix script (recommended)
./fix-wcode-complete.sh
```

#### Method 2: Manual Build
```bash
# Detect your architecture and build
npx gulp vscode-darwin-arm64    # For Apple Silicon (M1/M2/M3)
npx gulp vscode-darwin-x64      # For Intel Macs

# Install to Applications
./install-wcode-app.sh
```

#### CLI Setup
```bash
# Install CLI command
./install-wcode-cli.sh

# Usage
wcode .                    # Open current directory
wcode /path/to/project     # Open specific directory
wcode file.txt             # Open specific file
```

### 🪟 Windows

#### Build for Windows
```bash
# Build WCode for Windows
npx gulp vscode-win32-x64          # For 64-bit Windows
npx gulp vscode-win32-ia32         # For 32-bit Windows
npx gulp vscode-win32-arm64        # For ARM64 Windows
```

#### Installation
1. Navigate to `../VSCode-win32-x64/` (or your architecture folder)
2. Run `WCode - Enhanced Code Editor.exe`
3. Optionally, create a desktop shortcut or pin to taskbar

#### CLI Setup (Windows)
```cmd
# Add WCode to PATH or use the batch script
scripts\wcode.bat .
```

### 🐧 Linux

#### Build for Linux
```bash
# Build WCode for Linux
npx gulp vscode-linux-x64          # For 64-bit Linux
npx gulp vscode-linux-arm64        # For ARM64 Linux
npx gulp vscode-linux-armhf        # For ARM32 Linux
```

#### Installation
```bash
# Extract and install
cd ../VSCode-linux-x64/
chmod +x wcode
./wcode

# Create desktop entry (optional)
cp resources/linux/code.desktop ~/.local/share/applications/wcode.desktop
```

#### CLI Setup (Linux)
```bash
# Create symlink for global access
sudo ln -s /path/to/wcode/VSCode-linux-x64/wcode /usr/local/bin/wcode

# Usage
wcode .
```

## 🎨 Custom Icons

WCode includes an easy-to-use custom icon system:

### Adding Your Custom Icon

1. **Place your icon** in the `resources/wcode-custom-icons/` directory:
   ```bash
   # Supported formats: PNG, JPG, JPEG, ICO, ICNS
   cp your-icon.png resources/wcode-custom-icons/icon.png
   ```

2. **Rebuild WCode** to apply the new icon:
   ```bash
   # macOS (recommended - includes icon optimization)
   ./fix-wcode-complete.sh

   # Or manual approach
   node build/lib/wcode-icons-fixed.js
   npm run compile
   ```

3. **Icon Optimization**: The system automatically:
   - Converts images to appropriate formats for each platform
   - Creates rounded corners for macOS integration
   - Generates all required icon sizes
   - Applies icons to the built application

### Icon Naming Priority
The system looks for icons in this order:
1. `icon-rounded.png` (auto-generated, best for macOS)
2. `icon.png`, `icon.jpg`, `icon.jpeg`
3. `wcode-icon.*`
4. `app-icon.*`
5. Any image file in the directory

## 🎪 Customization Features

### Window Transparency
WCode includes native transparency controls:

```json
// In settings.json
{
  "window.transparency.enabled": true,
  "window.transparency.level": 0.9
}
```

### Custom Backgrounds
Set custom backgrounds for different areas:

```json
{
  "wcode.background.global.enabled": true,
  "wcode.background.global.image": "file:///path/to/background.jpg",
  "wcode.background.editor.enabled": true,
  "wcode.background.editor.opacity": 0.1
}
```

## 🛠️ Development

### Prerequisites
- **Node.js** 18.x or later
- **npm** 8.x or later
- **Python** 3.x (for native modules)
- **Git**

### Platform-specific Requirements

#### macOS
- **Xcode Command Line Tools**: `xcode-select --install`
- **Recommended**: 8GB+ RAM for building

#### Windows
- **Visual Studio Build Tools** or **Visual Studio Community**
- **Windows SDK**

#### Linux
- **build-essential**: `sudo apt install build-essential`
- **Additional packages**: `sudo apt install libnss3-dev libatk-bridge2.0-dev libdrm2-dev libxcomposite-dev libxdamage-dev libxrandr-dev libgbm-dev libxss-dev libasound2-dev`

### Building from Source

1. **Clone and Setup**:
   ```bash
   git clone https://github.com/Rixmerz/wcode.git
   cd wcode
   npm install
   ```

2. **Apply Custom Icons** (optional):
   ```bash
   # Add your icon to resources/wcode-custom-icons/
   cp your-icon.png resources/wcode-custom-icons/icon.png
   ```

3. **Build for Your Platform**:
   ```bash
   # macOS
   npx gulp vscode-darwin-arm64    # Apple Silicon
   npx gulp vscode-darwin-x64      # Intel

   # Windows
   npx gulp vscode-win32-x64       # 64-bit
   npx gulp vscode-win32-ia32      # 32-bit

   # Linux
   npx gulp vscode-linux-x64       # 64-bit
   npx gulp vscode-linux-arm64     # ARM64
   ```

4. **Install** (macOS):
   ```bash
   ./install-wcode-app.sh
   ```

### Development Scripts

- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode for development
- `./scripts/wcode.sh` - Run development version
- `./fix-wcode-complete.sh` - Complete build with optimizations (macOS)

## 🔌 Extensions

WCode maintains **100% compatibility** with the VSCode extension marketplace:

- **Full Marketplace Access**: All VSCode extensions work seamlessly
- **Automatic Updates**: Extensions update normally through the built-in marketplace
- **No Migration Needed**: Your existing extensions and settings work out of the box

## 🚀 CLI Usage

After installation, use the `wcode` command from anywhere:

```bash
# Open current directory
wcode .

# Open specific directory
wcode ~/my-project
wcode /path/to/project

# Open specific files
wcode README.md
wcode src/main.js

# Multiple files
wcode file1.js file2.css

# Show help
wcode --help

# Show version
wcode --version
```

## 🤝 Contributing

We welcome contributions to WCode! Here's how you can help:

### Reporting Issues
- [File a bug report](https://github.com/Rixmerz/wcode/issues/new?template=bug_report.md)
- [Request a feature](https://github.com/Rixmerz/wcode/issues/new?template=feature_request.md)

### Development
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly on your platform
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Areas for Contribution
- 🎨 UI/UX improvements
- 🐛 Bug fixes
- 📚 Documentation
- 🧪 Testing
- 🌍 Platform-specific optimizations

## 📝 Changelog

### Latest Changes
- ✅ Native window transparency controls
- ✅ Custom background system
- ✅ Automated icon customization
- ✅ CLI integration with `wcode` command
- ✅ macOS-optimized icons with rounded corners
- ✅ Full extension marketplace compatibility

## 🆘 Troubleshooting

### Common Issues

#### Icon Not Showing (macOS)
```bash
# Clear icon cache
rm -rf ~/Library/Caches/com.apple.iconservices.store
killall Dock
killall Finder

# Rebuild with icon fix
./fix-wcode-complete.sh
```

#### CLI Command Not Found
```bash
# Reinstall CLI
./install-wcode-cli.sh

# Or manually add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Build Errors
```bash
# Clean and rebuild
rm -rf node_modules
npm install
npm run compile
```

## 📄 License

WCode is licensed under the [MIT License](LICENSE.txt).

Based on [Visual Studio Code](https://github.com/microsoft/vscode) by Microsoft Corporation.

## 🙏 Acknowledgments

- **Microsoft** - For the amazing VSCode foundation
- **VSCode Community** - For the incredible ecosystem
- **Contributors** - For making WCode better

---

**Made with ❤️ for developers who want more control over their coding environment.**

For more information, visit our [GitHub repository](https://github.com/Rixmerz/wcode).
