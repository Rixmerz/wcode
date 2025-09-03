# WCode Custom Icons

Esta carpeta permite personalizar fácilmente el icono de la aplicación WCode.

## Cómo usar

1. **Coloca tu icono personalizado** en esta carpeta con uno de estos nombres:
   - `icon.png` (para Linux)
   - `icon.ico` (para Windows) 
   - `icon.icns` (para macOS)
   - O simplemente `icon` con cualquier extensión válida

2. **El sistema de build automáticamente detectará** cualquier archivo de imagen en esta carpeta y lo usará como icono de la aplicación.

3. **Formatos soportados**:
   - PNG (recomendado para Linux)
   - ICO (recomendado para Windows)
   - ICNS (recomendado para macOS)
   - JPG/JPEG (se convertirá automáticamente)

## Prioridad de archivos

Si hay múltiples archivos, el sistema usará esta prioridad:
1. `icon.png`, `icon.ico`, `icon.icns` (según la plataforma)
2. El primer archivo de imagen encontrado alfabéticamente

## Recomendaciones

- **Tamaño**: 512x512 píxeles o mayor
- **Formato**: PNG con transparencia para mejor calidad
- **Nombre**: Usa nombres descriptivos como `wcode-icon.png`

## Después de cambiar el icono

Ejecuta el build para aplicar los cambios:
```bash
npm run compile
```
