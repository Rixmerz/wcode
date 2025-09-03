# WCode - Documentación de Contenedores UI

## Resumen General

WCode (basado en VS Code) utiliza una arquitectura modular de contenedores para organizar su interfaz de usuario. Todos los contenedores principales están ubicados en la ruta base: `/src/vs/workbench/browser/parts/`

## 🏗️ Arquitectura de Contenedores

### Coordinador Principal
- **Layout Manager**: `/src/vs/workbench/browser/layout.ts`
  - Coordina toda la disposición de contenedores
  - Maneja el estado global del layout
  - Controla transiciones y redimensionado

## 📁 Contenedores Principales

### 🖥️ Editor Container
**Ubicación Principal**: `/src/vs/workbench/browser/parts/editor/`

#### Archivos Core:
- **`editorPart.ts`** - Contenedor principal del área de edición
- **`editorGroupView.ts`** - Vista de grupos de editores
- **`editorPanes.ts`** - Gestión de paneles de editor
- **`editorParts.ts`** - Coordinador de múltiples partes del editor
- **`auxiliaryEditorPart.ts`** - Editor auxiliar/secundario

#### Archivos de Control:
- **`editorTabsControl.ts`** - Control de pestañas
- **`multiEditorTabsControl.ts`** - Pestañas múltiples
- **`singleEditorTabsControl.ts`** - Pestaña única
- **`editorTitleControl.ts`** - Control de títulos

#### Archivos de Funcionalidad:
- **`textEditor.ts`** - Editor de texto base
- **`textCodeEditor.ts`** - Editor de código
- **`sideBySideEditor.ts`** - Editor lado a lado
- **`breadcrumbsControl.ts`** - Control de breadcrumbs

#### Estilos CSS:
- **Media Folder**: `/editor/media/`
  - `editorgroupview.css`
  - `editortabscontrol.css`
  - `editorstatus.css`
  - `breadcrumbscontrol.css`

---

### 📂 Sidebar Container
**Ubicación Principal**: `/src/vs/workbench/browser/parts/sidebar/`

#### Archivos Core:
- **`sidebarPart.ts`** - Contenedor principal de la barra lateral
- **`sidebarActions.ts`** - Acciones de la barra lateral

#### Archivos de Vista:
- **`/views/viewPaneContainer.ts`** - Contenedor de paneles de vista
- **`/views/viewPane.ts`** - Panel de vista individual
- **`/views/viewsViewlet.ts`** - Viewlet de vistas

#### Estilos CSS:
- **`/sidebar/media/sidebarpart.css`** - Estilos principales
- **`/views/media/paneviewlet.css`** - Estilos de paneles
- **`/views/media/views.css`** - Estilos generales de vistas

---

### 🎨 Background Container
**Coordinador**: `/src/vs/workbench/browser/layout.ts`

#### Archivos de Tema:
- **`/src/vs/workbench/common/theme.ts`** - Temas globales
- **`/src/vs/platform/theme/common/colors/`** - Definiciones de colores

#### Componentes de Fondo:
- **StatusBar**: `/statusbar/statusbarPart.ts`
- **ActivityBar**: `/activitybar/activitybarPart.ts`
- **Banner**: `/banner/bannerPart.ts`

---

## 🔧 Contenedores Adicionales

### Panel Container
**Ubicación**: `/src/vs/workbench/browser/parts/panel/`
- **`panelPart.ts`** - Panel inferior/lateral
- **`panelActions.ts`** - Acciones del panel
- **CSS**: `/panel/media/panelpart.css`

### Titlebar Container
**Ubicación**: `/src/vs/workbench/browser/parts/titlebar/`
- **`titlebarPart.ts`** - Barra de título
- **`menubarControl.ts`** - Control de menú
- **`commandCenterControl.ts`** - Centro de comandos
- **CSS**: `/titlebar/media/titlebarpart.css`

### StatusBar Container
**Ubicación**: `/src/vs/workbench/browser/parts/statusbar/`
- **`statusbarPart.ts`** - Barra de estado
- **`statusbarItem.ts`** - Elementos de estado
- **CSS**: `/statusbar/media/statusbarpart.css`

### ActivityBar Container
**Ubicación**: `/src/vs/workbench/browser/parts/activitybar/`
- **`activitybarPart.ts`** - Barra de actividades
- **CSS**: `/activitybar/media/activitybarpart.css`

### AuxiliaryBar Container
**Ubicación**: `/src/vs/workbench/browser/parts/auxiliarybar/`
- **`auxiliaryBarPart.ts`** - Barra auxiliar
- **`auxiliaryBarActions.ts`** - Acciones auxiliares
- **CSS**: `/auxiliarybar/media/auxiliaryBarPart.css`

---

## 🎯 Servicios de Soporte

### Layout Service
**Ubicación**: `/src/vs/workbench/services/layout/browser/layoutService.ts`
- Define interfaces y constantes de layout
- Gestiona posiciones y dimensiones
- Controla visibilidad de partes

### PaneComposite Service
**Ubicación**: `/src/vs/workbench/browser/parts/paneCompositePart.ts`
- **`paneCompositePartService.ts`** - Servicio de partes compuestas
- **`paneCompositeBar.ts`** - Barra de elementos compuestos
- **CSS**: `/media/paneCompositePart.css`

---

## 📊 Jerarquía de Contenedores

```
Layout (Coordinador Principal)
├── Titlebar Container
├── Banner Container
├── ActivityBar Container
├── Sidebar Container
│   └── ViewPane Containers
├── Editor Container
│   ├── Editor Groups
│   ├── Editor Tabs
│   └── Breadcrumbs
├── Panel Container
├── AuxiliaryBar Container
└── StatusBar Container
```

---

## 🔍 Archivos de Configuración

### Theme Configuration
- **`/src/vs/workbench/common/theme.ts`** - Colores y temas principales
- **`/src/vs/platform/theme/common/themeService.ts`** - Servicio de temas

### Layout Configuration
- **`/src/vs/workbench/browser/layout.ts`** - Configuración de layout principal
- **Enums de Layout**: `LayoutClasses`, `Parts`, `Position`

---

## 🛠️ Notas de Desarrollo

### Patrones de Arquitectura
1. **Part Pattern**: Cada contenedor hereda de `Part` base class
2. **Service Pattern**: Servicios dedicados para coordinación
3. **Event-Driven**: Comunicación mediante eventos entre contenedores
4. **CSS Modular**: Estilos separados por contenedor en carpetas `/media/`

### Puntos de Extensión
- **ViewContainers**: Para agregar nuevas vistas en sidebar
- **EditorPanes**: Para nuevos tipos de editores
- **StatusBarItems**: Para elementos de barra de estado
- **ActivityBarItems**: Para botones de barra de actividades

---

## 📝 Referencias Útiles

### Interfaces Principales
- `IWorkbenchLayoutService` - Servicio principal de layout
- `IPaneCompositePartService` - Gestión de partes compuestas
- `IEditorGroupsService` - Gestión de grupos de editores
- `IViewDescriptorService` - Descriptores de vistas

### Constantes Importantes
- `Parts` enum - Identificadores de partes
- `Position` enum - Posiciones de contenedores
- `MULTI_WINDOW_PARTS` - Partes multi-ventana
- `SINGLE_WINDOW_PARTS` - Partes ventana única

---

*Documentación generada para WCode - Proyecto basado en VS Code*