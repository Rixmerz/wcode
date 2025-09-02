# WCode - Window Transparency and Editor Background

This document describes the implementation of WCode's enhanced personalization features: window transparency and editor-specific background images.

## Features Overview

### 1. Window Transparency
- **Purpose**: Make the entire WCode window semi-transparent
- **Configuration**: `window.transparency.enabled` and `window.transparency.opacity`
- **Behavior**: Requires application restart when enabled/disabled
- **Implementation**: Uses Electron's native transparency support

### 2. Global Window Background
- **Purpose**: Add custom background images behind all UI elements (sidebar, terminal, editor, etc.)
- **Configuration**: `wcode.background.global.*` settings
- **Behavior**: Updates in real-time when settings change
- **Implementation**: Fixed positioned div element behind the workbench

### 3. Editor-Specific Background
- **Purpose**: Add custom background images specifically to code editor areas only
- **Configuration**: `wcode.background.editor.*` settings
- **Behavior**: Updates in real-time when settings change
- **Implementation**: CSS injection with pseudo-elements targeting editor content

## Configuration Schema

### Window Transparency Settings
```json
{
  "window.transparency.enabled": {
    "type": "boolean",
    "default": false,
    "description": "Enable window transparency"
  },
  "window.transparency.opacity": {
    "type": "number",
    "default": 1.0,
    "minimum": 0.1,
    "maximum": 1.0,
    "description": "Set the window opacity level"
  }
}
```

### Global Background Settings
```json
{
  "wcode.background.global.enabled": {
    "type": "boolean",
    "default": false,
    "description": "Enable custom background images for the entire window"
  },
  "wcode.background.global.image": {
    "type": "string",
    "default": "",
    "description": "Path to the global background image file (supports local files and URLs)"
  },
  "wcode.background.global.opacity": {
    "type": "number",
    "default": 0.1,
    "minimum": 0.01,
    "maximum": 1.0,
    "description": "Set the global background image opacity"
  },
  "wcode.background.global.size": {
    "type": "string",
    "enum": ["cover", "contain", "auto", "stretch"],
    "default": "cover",
    "description": "How the global background image should be sized"
  },
  "wcode.background.global.position": {
    "type": "string",
    "enum": ["center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"],
    "default": "center",
    "description": "Position of the global background image"
  }
}
```

### Editor Background Settings
```json
{
  "wcode.background.editor.enabled": {
    "type": "boolean",
    "default": false,
    "description": "Enable custom background images for the code editor only"
  },
  "wcode.background.editor.image": {
    "type": "string",
    "default": "",
    "description": "Path to the editor background image file (supports local files and URLs)"
  },
  "wcode.background.editor.opacity": {
    "type": "number",
    "default": 0.1,
    "minimum": 0.01,
    "maximum": 1.0,
    "description": "Set the editor background image opacity"
  },
  "wcode.background.editor.size": {
    "type": "string",
    "enum": ["cover", "contain", "auto", "stretch"],
    "default": "cover",
    "description": "How the editor background image should be sized"
  },
  "wcode.background.editor.position": {
    "type": "string",
    "enum": ["center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"],
    "default": "center",
    "description": "Position of the editor background image"
  }
}
```

## Implementation Details

### Window Transparency
- **Location**: `src/vs/platform/windows/electron-main/windows.ts` and `windowImpl.ts`
- **Method**: Sets `transparent: true` in BrowserWindow options and applies opacity with `setOpacity()`
- **Restart Required**: Yes, when enabling/disabling transparency

### Editor Background
- **Location**: `src/vs/workbench/contrib/wcode/browser/wcodeBackgroundService.ts`
- **Method**: CSS injection using pseudo-elements on `.monaco-editor` selectors
- **Real-time Updates**: Yes, changes apply immediately

### Image URL Resolution
- **HTTP URLs**: Used directly (e.g., `https://example.com/image.jpg`)
- **Local Files**: Converted to `vscode-file://vscode-app/path/to/image.jpg` scheme
- **Supported Formats**: All formats supported by CSS `background-image`

## Usage Examples

### Basic Transparency
```json
{
  "window.transparency.enabled": true,
  "window.transparency.opacity": 0.85
}
```

### Global Window Background with Online Image
```json
{
  "wcode.background.global.enabled": true,
  "wcode.background.global.image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
  "wcode.background.global.opacity": 0.15,
  "wcode.background.global.size": "cover",
  "wcode.background.global.position": "center"
}
```

### Editor-Only Background with Local Image
```json
{
  "wcode.background.editor.enabled": true,
  "wcode.background.editor.image": "/Users/username/Pictures/background.jpg",
  "wcode.background.editor.opacity": 0.1,
  "wcode.background.editor.size": "cover"
}
```

### Both Global and Editor Backgrounds (Different Images)
```json
{
  "window.transparency.enabled": true,
  "window.transparency.opacity": 0.9,
  "wcode.background.global.enabled": true,
  "wcode.background.global.image": "https://example.com/global-bg.jpg",
  "wcode.background.global.opacity": 0.05,
  "wcode.background.editor.enabled": true,
  "wcode.background.editor.image": "/Users/username/Pictures/editor-bg.jpg",
  "wcode.background.editor.opacity": 0.12
}
```

## Technical Notes

- Editor backgrounds use CSS pseudo-elements to avoid interfering with editor functionality
- Window transparency requires Electron's native support and may have platform-specific limitations
- Local file paths are automatically converted to the appropriate vscode-file:// scheme
- All settings are scoped to APPLICATION level for consistency across workspaces

## Removed Features

The following features were removed from the original implementation:
- Terminal background customization
- Sidebar background customization
- Terminal color theming
- Any UI area backgrounds other than the code editor

This focused approach ensures better performance and maintains clear separation between window-level transparency and editor-specific customization.
