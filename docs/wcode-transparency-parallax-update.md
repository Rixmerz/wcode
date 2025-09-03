# WCode - Transparency and Parallax Background Update

## Cambios Realizados

### 1. Configuración de Transparencia Movida a WCode

**Antes:**
```json
{
  "window.transparency.enabled": true,
  "window.transparency.opacity": 0.85
}
```

**Ahora:**
```json
{
  "wcode.transparency.enabled": true,
  "wcode.transparency.opacity": 0.85
}
```

### 2. Nueva Funcionalidad de Parallax para Editor

Se agregó una nueva configuración para habilitar el efecto parallax en el fondo del editor:

```json
{
  "wcode.background.editor.parallax": true
}
```

**Beneficios del Parallax:**
- ✅ Evita el escalado incorrecto cuando hay muchas líneas de código
- ✅ El fondo permanece fijo al viewport, no al contenido del editor
- ✅ Mejor rendimiento visual con archivos largos
- ✅ Efecto visual más atractivo

### 3. Configuraciones Completas de WCode

```json
{
  // Transparencia de ventana
  "wcode.transparency.enabled": true,
  "wcode.transparency.opacity": 0.9,
  
  // Fondo global (detrás de toda la UI)
  "wcode.background.global.enabled": true,
  "wcode.background.global.image": "https://example.com/background.jpg",
  "wcode.background.global.opacity": 0.1,
  "wcode.background.global.size": "cover",
  "wcode.background.global.position": "center",
  
  // Fondo del editor (solo en áreas de código)
  "wcode.background.editor.enabled": true,
  "wcode.background.editor.image": "/path/to/editor-background.jpg",
  "wcode.background.editor.opacity": 0.15,
  "wcode.background.editor.size": "cover",
  "wcode.background.editor.position": "center",
  "wcode.background.editor.parallax": true
}
```

## Solución al Problema de Escalado

### Problema Original
Cuando el editor tenía muchas líneas de código, el contenedor del editor crecía tanto en X como en Y, causando que la imagen de fondo se escalara incorrectamente.

### Solución Implementada
1. **Modo Parallax (por defecto)**: El fondo se aplica con `position: fixed` y `background-attachment: fixed`
2. **Clipping inteligente**: Se usa `clip-path` para mostrar el fondo solo en áreas del editor
3. **Contenedor específico**: El fondo se aplica a `.monaco-editor` directamente, no a elementos internos que crecen

### Modos de Funcionamiento

#### Modo Parallax (`parallax: true`)
```css
.monaco-editor::before {
  position: fixed;
  background-attachment: fixed;
  /* El fondo permanece fijo al viewport */
}
```

#### Modo Tradicional (`parallax: false`)
```css
.monaco-editor .monaco-editor-background::before {
  position: absolute;
  /* El fondo se mueve con el contenido */
}
```

## Archivos Modificados

1. **`src/vs/workbench/contrib/wcode/browser/wcode.contribution.ts`**
   - Movió configuraciones de transparencia de `window.*` a `wcode.*`
   - Agregó configuración `wcode.background.editor.parallax`

2. **`src/vs/workbench/contrib/wcode/browser/wcodeBackgroundService.ts`**
   - Implementó lógica de parallax scrolling
   - Mejoró el sistema de aplicación de fondos del editor
   - Solucionó el problema de escalado con archivos largos

3. **`src/vs/platform/windows/electron-main/windowImpl.ts`**
   - Actualizado para usar `wcode.transparency.*` en lugar de `window.transparency.*`

4. **`src/vs/platform/windows/electron-main/windows.ts`**
   - Actualizado para usar `wcode.transparency.*` en lugar de `window.transparency.*`

## Migración para Usuarios

Los usuarios existentes necesitarán actualizar sus configuraciones:

```bash
# Buscar y reemplazar en settings.json
sed -i 's/window\.transparency\./wcode.transparency./g' settings.json
```

O manualmente cambiar:
- `window.transparency.enabled` → `wcode.transparency.enabled`
- `window.transparency.opacity` → `wcode.transparency.opacity`

## Notas Técnicas

- El parallax está habilitado por defecto (`parallax: true`)
- La transparencia de ventana sigue requiriendo reinicio de la aplicación
- Los fondos del editor se aplican en tiempo real sin reinicio
- Compatible con todos los formatos de imagen soportados por CSS
- Funciona con URLs remotas y archivos locales (convertidos automáticamente a `vscode-file://`)
