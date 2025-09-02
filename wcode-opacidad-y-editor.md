# WCode — Opacidad global y fondo solo en el editor de código

Este documento describe cómo se implementó:
- La opacidad global para toda la aplicación WCode (ventana de Electron)
- Un fondo (imagen) aplicado exclusivamente al área de edición de código (editor)

Incluye claves de configuración, los puntos de integración en el proceso principal (Electron) y la lógica de superposición (overlay) en el renderizador para el editor.

---

## 1) Opacidad global de la aplicación

La opacidad global se maneja en el **proceso principal de Electron** al crear la `BrowserWindow` y aplicar opacidad tras su creación.

### Claves de configuración

Añade estas claves en Settings (JSON):

```json
{
  "window.transparency.enabled": true,
  "window.transparency.opacity": 0.85
}
```

- `window.transparency.enabled`: activa/desactiva transparencia de la ventana.
- `window.transparency.opacity`: valor entre 0.1 y 1.0 aplicado a la ventana.

### Cambios en el proceso principal (Electron)

1) Al preparar las opciones de la ventana, si la transparencia está activada, se usa un color de fondo transparente:

```ts
// windows.ts (opciones BrowserWindow)
backgroundColor: transparencyEnabled ? '#00000000' : themeMainService.getBackgroundColor(),
```

2) Una vez creada la ventana, se aplica la opacidad con `setOpacity` (no es válido en el constructor):

```ts
// windowImpl.ts (después de crear BrowserWindow)
const enabled = this.configurationService.getValue<boolean>('window.transparency.enabled') ?? false;
const opacity = this.configurationService.getValue<number>('window.transparency.opacity') ?? 1.0;
if (enabled && this._win) {
  this._win.setOpacity(Math.max(0.1, Math.min(1.0, opacity)));
}
```

Notas:
- Cambiar `window.transparency.enabled` requiere reiniciar la app para ver el efecto.
- La opacidad afecta a toda la ventana, pero para “ver” el escritorio detrás es necesario que el contenido del renderizador no sea opaco (ver sección 2 para el editor).

---

## 2) Imagen de fondo solo en el área de edición de código

Para el editor, se utiliza un **overlay CSS** (pseudo-elemento `::before`) sobre el contenedor de grupos de editor. Además, se fuerzan **capas del editor** a fondo transparente para que la imagen sea visible, sin ocultar el contenido (texto, cursores, etc.).

### Claves de configuración (ejemplo)

```json
{
  "wcode.background.enabled": true,
  "wcode.background.image": "/ruta/absoluta/a/tu/imagen.jpg",
  "wcode.background.opacity": 0.25,
  "wcode.background.size": "cover",
  "wcode.background.position": "center"
}
```

- La ruta puede ser absoluta local o URL. El servicio convierte rutas locales absolutas al esquema `vscode-file://` para evitar bloqueos del navegador.

### Lógica del overlay en el renderizador

Se inyecta una hoja de estilo (`<style>`) cuando la opción está habilitada. Regla clave:

```css
.monaco-workbench .part.editor > .content .editor-group-container::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url('<imagen-resuelta>');
  background-position: <position>;
  background-size: <size>;
  background-repeat: no-repeat;
  opacity: <opacity>;
  z-index: 0;
}
```

Además, se fuerzan fondos transparentes en capas del editor (por ejemplo, `.monaco-editor`, `.monaco-editor-background`, `.overflow-guard`, etc.) de forma que el overlay permanezca **detrás** y el contenido siga siendo perfectamente legible y operativo.

### Por qué un overlay con `::before`

- Es simple, performante y no interfiere con la interacción (`pointer-events: none`).
- Evita **reemplazar** el contenido; solo añade una **capa de base** (z-index bajo) sobre el área del editor.

---

## 3) Notas de depuración y compatibilidad

- Si usas una imagen local (p. ej. `/Users/tuUsuario/Pictures/fondo.jpg`), el servicio la resolverá a `vscode-file://...` automáticamente. URLs `https://` y `data:` también funcionan.
- Si un tema aplica un color de fondo opaco a algún contenedor, ese color puede tapar el overlay. En ese caso, se añade (desde el servicio) una regla CSS que fuerce `background: transparent !important;` en capas puntuales del editor.
- Cambios en el proceso principal demandan reinicio completo; cambios de CSS en el renderizador suelen aplicarse con recarga de ventana.

---

## 4) Cómo probar rápidamente

1) Añade las claves de configuración anteriores en Settings (JSON).
2) Reinicia WCode si cambiaste `window.transparency.enabled`.
3) Abre uno o más editores y verifica que el fondo aparece detrás del código.
4) Ajusta `wcode.background.opacity` para equilibrar legibilidad y estética.

---

## 5) Archivos relevantes

- Proceso principal (Electron):
  - `src/vs/platform/windows/electron-main/windows.ts`
  - `src/vs/platform/windows/electron-main/windowImpl.ts`
- Lógica de overlays (renderizador):
  - `src/vs/workbench/contrib/wcode/browser/wcodeBackgroundService.ts`

---

## 6) Preguntas frecuentes

- ¿Por qué no usar `opacity` en las opciones del constructor de `BrowserWindow`?
  - Electron no soporta `opacity` en el constructor; debe aplicarse con `setOpacity` después de crear la ventana.

- ¿El overlay del editor afecta el rendimiento?
  - Es una capa CSS con una imagen; con tamaños razonables y `pointer-events: none` el impacto es mínimo. Evitar imágenes gigantes.

- ¿Puedo usar imágenes remotas?
  - Sí. `https://` y `data:` son soportados. Para locales, usa rutas absolutas; el servicio las adapta a `vscode-file://`.

