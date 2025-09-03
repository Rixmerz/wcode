# VS Code UI Architecture - Complete Development Guide

## Tabla de Contenidos
1. [Arquitectura Fundamental](#arquitectura-fundamental)
2. [Sistema de Inyección de Dependencias](#sistema-de-inyección-de-dependencias)
3. [Sistema de Eventos y Comunicación](#sistema-de-eventos-y-comunicación)
4. [Gestión de Estado](#gestión-de-estado)
5. [Arquitectura de Temas](#arquitectura-de-temas)
6. [Arquitectura CSS](#arquitectura-css)
7. [Sistema de Layout y Renderizado](#sistema-de-layout-y-renderizado)
8. [Servicios Core](#servicios-core)
9. [Configuración y Puntos de Extensión](#configuración-y-puntos-de-extensión)
10. [Performance y Seguridad](#performance-y-seguridad)
11. [Guía de Implementación Práctica](#guía-de-implementación-práctica)

---

## Arquitectura Fundamental

### 🏗️ Overview General

VS Code está construido sobre una arquitectura modular altamente sofisticada que separa responsabilidades en:

**Capas Principales:**
- **Platform Layer** (`/src/vs/platform/`) - Servicios base del sistema
- **Base Layer** (`/src/vs/base/`) - Utilities y componentes básicos
- **Editor Layer** (`/src/vs/editor/`) - Monaco Editor core
- **Workbench Layer** (`/src/vs/workbench/`) - UI y lógica de aplicación

### Principios Arquitectónicos

```typescript
// Patrón principal: Todo es un servicio
interface IService {
  readonly _serviceBrand: undefined;
}

// Ejemplo de servicio base
interface ILayoutService extends IService {
  readonly onDidChangePartVisibility: Event<void>;
  isVisible(part: Parts): boolean;
  togglePartVisibility(part: Parts): void;
}
```

### Estructura de Archivos Core

```
/src/vs/
├── platform/           # Servicios de plataforma
│   ├── instantiation/  # DI Container
│   ├── registry/       # Sistema de registro
│   ├── theme/          # Sistema de temas
│   └── configuration/  # Configuraciones
├── base/               # Utilities base
│   ├── browser/        # DOM utilities
│   ├── common/         # Common utilities
│   └── parts/          # Componentes base
├── editor/             # Monaco Editor
│   ├── browser/        # Editor browser
│   ├── common/         # Editor common
│   └── contrib/        # Editor contributions
└── workbench/          # Workbench UI
    ├── browser/        # Browser workbench
    ├── services/       # Workbench services
    └── contrib/        # Feature contributions
```

---

## Sistema de Inyección de Dependencias

### 🔌 Conceptos Core

El sistema DI de VS Code es el corazón de la arquitectura, permitiendo:
- **Loose Coupling** - Servicios desacoplados
- **Testability** - Fácil testing con mocks
- **Modularity** - Composición flexible de servicios
- **Lifecycle Management** - Gestión automática del ciclo de vida

### Archivos Clave

```typescript
// Ubicaciones principales:
/src/vs/platform/instantiation/common/instantiation.ts
/src/vs/platform/instantiation/common/serviceCollection.ts
/src/vs/platform/instantiation/common/instantiationService.ts
```

### Implementación del DI Container

```typescript
// Definición de servicio
export interface IMyService extends IService {
  readonly _serviceBrand: undefined;
  doSomething(): void;
}

// Token de servicio
export const IMyService = createDecorator<IMyService>('myService');

// Implementación
class MyService implements IMyService {
  declare readonly _serviceBrand: undefined;
  
  constructor(
    @ILogService private readonly logService: ILogService,
    @IConfigurationService private readonly configService: IConfigurationService
  ) {}
  
  doSomething(): void {
    this.logService.info('Doing something');
  }
}

// Registro del servicio
registerSingleton(IMyService, MyService, InstantiationType.Delayed);
```

### Service Collection Pattern

```typescript
// Configuración de servicios
const serviceCollection = new ServiceCollection();

// Registro de servicios core
serviceCollection.set(ILogService, new ConsoleLogService());
serviceCollection.set(IConfigurationService, new ConfigurationService());
serviceCollection.set(IThemeService, new ThemeService());

// Creación del instantiation service
const instantiationService = new InstantiationService(serviceCollection);

// Uso del container
const myService = instantiationService.createInstance(MyService);
```

### Decoradores de Inyección

```typescript
// @optional - Dependencia opcional
constructor(
  @optional(IOptionalService) private optionalService?: IOptionalService
) {}

// @memoize - Memoización automática
@memoize
get expensiveComputation(): string {
  return this.doExpensiveWork();
}
```

### Service Registration Patterns

```typescript
// Singleton registration
registerSingleton(IServiceId, ServiceClass, InstantiationType.Eager);

// Delayed singleton
registerSingleton(IServiceId, ServiceClass, InstantiationType.Delayed);

// Factory registration
ServiceCollection.set(IServiceId, {
  createInstance: (accessor: ServicesAccessor) => {
    const dep1 = accessor.get(IDependency1);
    return new ServiceClass(dep1);
  }
});
```

---

## Sistema de Eventos y Comunicación

### 📡 Event System Architecture

VS Code utiliza un sistema de eventos robusto basado en el patrón Observer:

### Archivos Clave

```typescript
// Sistema de eventos:
/src/vs/base/common/event.ts
/src/vs/base/common/lifecycle.ts
/src/vs/platform/registry/common/platform.ts
```

### Event Emitter Pattern

```typescript
import { Emitter, Event } from 'vs/base/common/event';

class MyService {
  private readonly _onDidChange = new Emitter<string>();
  readonly onDidChange: Event<string> = this._onDidChange.event;
  
  private readonly _onDidDispose = new Emitter<void>();
  readonly onDidDispose: Event<void> = this._onDidDispose.event;
  
  changeValue(value: string): void {
    this._onDidChange.fire(value);
  }
  
  dispose(): void {
    this._onDidDispose.fire();
    this._onDidChange.dispose();
    this._onDidDispose.dispose();
  }
}

// Uso del evento
const service = new MyService();
const disposable = service.onDidChange(value => {
  console.log('Value changed:', value);
});

// Cleanup
disposable.dispose();
```

### Command System

```typescript
// Ubicación: /src/vs/platform/commands/common/commands.ts

// Definición de comando
interface ICommandAction {
  id: string;
  title: string;
  category?: string;
}

// Registro de comando
CommandsRegistry.registerCommand({
  id: 'my.custom.command',
  handler: (accessor: ServicesAccessor, ...args: any[]) => {
    const editorService = accessor.get(IEditorService);
    // Lógica del comando
  }
});

// Ejecución de comando
const commandService = accessor.get(ICommandService);
commandService.executeCommand('my.custom.command', arg1, arg2);
```

### Context Keys System

```typescript
// Ubicación: /src/vs/platform/contextkey/common/contextkey.ts

// Definición de context key
const MY_CONTEXT_KEY = new RawContextKey<boolean>('myContextKey', false);

// Uso en servicio
class MyService {
  private readonly myContextKey: IContextKey<boolean>;
  
  constructor(
    @IContextKeyService contextKeyService: IContextKeyService
  ) {
    this.myContextKey = MY_CONTEXT_KEY.bindTo(contextKeyService);
  }
  
  updateContext(value: boolean): void {
    this.myContextKey.set(value);
  }
}
```

### Registry Pattern

```typescript
// Sistema de registro para extensibilidad
class Registry<T> {
  private readonly items: T[] = [];
  private readonly _onDidRegister = new Emitter<T>();
  
  readonly onDidRegister: Event<T> = this._onDidRegister.event;
  
  register(item: T): IDisposable {
    this.items.push(item);
    this._onDidRegister.fire(item);
    
    return toDisposable(() => {
      const index = this.items.indexOf(item);
      if (index >= 0) {
        this.items.splice(index, 1);
      }
    });
  }
  
  getAll(): T[] {
    return this.items.slice();
  }
}
```

---

## Gestión de Estado

### 🗂️ State Management Architecture

VS Code maneja estado a través de múltiples capas:

### Configuration Service

```typescript
// Ubicación: /src/vs/platform/configuration/common/configuration.ts

interface IConfigurationService extends IService {
  readonly onDidChangeConfiguration: Event<IConfigurationChangeEvent>;
  getValue<T>(section?: string, overrides?: IConfigurationOverrides): T;
  updateValue(key: string, value: any, target?: ConfigurationTarget): Promise<void>;
}

// Uso práctico
class MyService {
  constructor(
    @IConfigurationService private readonly configService: IConfigurationService
  ) {
    // Escuchar cambios de configuración
    this.configService.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('myExtension.setting')) {
        this.handleConfigChange();
      }
    });
  }
  
  private handleConfigChange(): void {
    const setting = this.configService.getValue<string>('myExtension.setting');
    // Reaccionar al cambio
  }
}
```

### Storage Service

```typescript
// Ubicación: /src/vs/platform/storage/common/storage.ts

interface IStorageService extends IService {
  readonly onDidChangeValue: Event<IStorageValueChangeEvent>;
  
  get(key: string, scope: StorageScope, fallbackValue?: string): string | undefined;
  store(key: string, value: string | boolean | number, scope: StorageScope, target: StorageTarget): void;
  remove(key: string, scope: StorageScope): void;
}

// Tipos de storage
enum StorageScope {
  PROFILE = 0,    // Por perfil de usuario
  WORKSPACE = 1   // Por workspace
}

enum StorageTarget {
  USER = 1,
  MACHINE = 2
}

// Ejemplo de uso
class MyService {
  private static readonly STORAGE_KEY = 'myService.data';
  
  constructor(
    @IStorageService private readonly storageService: IStorageService
  ) {}
  
  saveData(data: any): void {
    this.storageService.store(
      MyService.STORAGE_KEY,
      JSON.stringify(data),
      StorageScope.WORKSPACE,
      StorageTarget.MACHINE
    );
  }
  
  loadData(): any {
    const data = this.storageService.get(
      MyService.STORAGE_KEY,
      StorageScope.WORKSPACE
    );
    return data ? JSON.parse(data) : null;
  }
}
```

### Memento Pattern para State

```typescript
// Ubicación: /src/vs/workbench/common/memento.ts

interface IMemento {
  getMemento(scope: StorageScope, target: StorageTarget): object;
  saveMemento(): void;
}

// Uso en vistas
class MyViewPane extends ViewPane {
  private static readonly MEMENTO_KEY = 'myViewPane';
  
  constructor(
    options: IViewPaneOptions,
    @IStorageService storageService: IStorageService
  ) {
    super(options, storageService);
  }
  
  saveState(): void {
    const memento = this.getMemento(StorageScope.WORKSPACE, StorageTarget.MACHINE);
    memento['viewState'] = this.getViewState();
  }
  
  restoreState(): void {
    const memento = this.getMemento(StorageScope.WORKSPACE, StorageTarget.MACHINE);
    const viewState = memento['viewState'];
    if (viewState) {
      this.restoreViewState(viewState);
    }
  }
}
```

### Workspace State

```typescript
// Ubicación: /src/vs/platform/workspace/common/workspace.ts

interface IWorkspaceContextService extends IService {
  readonly onDidChangeWorkbenchState: Event<WorkbenchState>;
  readonly onDidChangeWorkspaceFolders: Event<IWorkspaceFoldersChangeEvent>;
  
  getWorkbenchState(): WorkbenchState;
  getWorkspace(): IWorkspace;
  getWorkspaceFolder(resource: URI): IWorkspaceFolder | null;
}

enum WorkbenchState {
  EMPTY = 1,
  FOLDER = 2,
  WORKSPACE = 3
}
```

---

## Arquitectura de Temas

### 🎨 Theme System Architecture

El sistema de temas de VS Code es altamente sofisticado y permite personalización completa:

### Archivos Clave

```typescript
// Sistema de temas:
/src/vs/platform/theme/common/themeService.ts
/src/vs/platform/theme/common/colorRegistry.ts
/src/vs/platform/theme/common/colors/
/src/vs/workbench/common/theme.ts
```

### Theme Service Interface

```typescript
interface IThemeService extends IService {
  readonly onDidColorThemeChange: Event<IColorTheme>;
  readonly onDidFileIconThemeChange: Event<IFileIconTheme>;
  readonly onDidProductIconThemeChange: Event<IProductIconTheme>;
  
  getColorTheme(): IColorTheme;
  getFileIconTheme(): IFileIconTheme;
  getProductIconTheme(): IProductIconTheme;
  
  setColorTheme(themeId: string, settingsTarget: ConfigurationTarget | undefined | 'auto'): Promise<IColorTheme | null>;
}
```

### Color Registration System

```typescript
// Registro de colores personalizados
import { registerColor } from 'vs/platform/theme/common/colorRegistry';
import { Color } from 'vs/base/common/color';

// Definición de color
export const myCustomColor = registerColor(
  'myExtension.customColor',
  { dark: '#FF6B6B', light: '#FF8E8E', hcDark: '#FF6B6B', hcLight: '#000000' },
  'Description of my custom color'
);

// Uso en CSS
export const myCustomColorBorder = registerColor(
  'myExtension.customColorBorder',
  { dark: myCustomColor, light: myCustomColor, hcDark: myCustomColor, hcLight: contrastBorder },
  'Border color for my custom component'
);
```

### Theme-aware Components

```typescript
// Componente que reacciona a cambios de tema
class MyThemedComponent extends Disposable {
  private element: HTMLElement;
  
  constructor(
    container: HTMLElement,
    @IThemeService private readonly themeService: IThemeService
  ) {
    super();
    
    this.element = dom.append(container, dom.$('.my-component'));
    
    // Aplicar tema inicial
    this.updateTheme();
    
    // Reaccionar a cambios de tema
    this._register(this.themeService.onDidColorThemeChange(() => {
      this.updateTheme();
    }));
  }
  
  private updateTheme(): void {
    const theme = this.themeService.getColorTheme();
    
    // Obtener colores del tema
    const backgroundColor = theme.getColor(myCustomColor);
    const borderColor = theme.getColor(myCustomColorBorder);
    
    // Aplicar estilos
    if (backgroundColor) {
      this.element.style.backgroundColor = backgroundColor.toString();
    }
    if (borderColor) {
      this.element.style.borderColor = borderColor.toString();
    }
  }
}
```

### CSS Theme Variables

```css
/* Uso de variables de tema en CSS */
.my-component {
  background-color: var(--vscode-myExtension-customColor);
  border: 1px solid var(--vscode-myExtension-customColorBorder);
  color: var(--vscode-foreground);
}

/* Colores base del sistema */
.editor-background {
  background-color: var(--vscode-editor-background);
}

.sidebar-background {
  background-color: var(--vscode-sideBar-background);
}
```

### Icon Theme System

```typescript
// Ubicación: /src/vs/platform/theme/common/iconRegistry.ts

// Registro de iconos
const myCustomIcon = registerIcon('my-custom-icon', Codicon.symbol, 'My custom icon');

// Uso en componentes
class MyComponent {
  private createIcon(): HTMLElement {
    const iconElement = dom.$('span');
    iconElement.className = ThemeIcon.asClassName(myCustomIcon);
    return iconElement;
  }
}
```

### Theme Contribution

```json
// En package.json de extensión
{
  "contributes": {
    "themes": [
      {
        "id": "my-custom-theme",
        "label": "My Custom Theme",
        "uiTheme": "vs-dark",
        "path": "./themes/my-theme.json"
      }
    ],
    "colors": [
      {
        "id": "myExtension.customColor",
        "description": "Custom color for my extension",
        "defaults": {
          "dark": "#FF6B6B",
          "light": "#FF8E8E"
        }
      }
    ]
  }
}
```

---

## Arquitectura CSS

### 🎭 CSS Architecture & Styling System

VS Code utiliza un sistema CSS modular y escalable:

### Estructura CSS

```
/src/vs/workbench/browser/media/
├── workbench.css           # Estilos base del workbench
├── part.css               # Estilos base para parts
└── style.css              # Estilos globales

/src/vs/workbench/browser/parts/
├── editor/media/          # Estilos del editor
├── sidebar/media/         # Estilos del sidebar
├── panel/media/           # Estilos del panel
└── statusbar/media/       # Estilos de la barra de estado
```

### CSS Custom Properties System

```css
/* Variables CSS dinámicas */
:root {
  --vscode-font-family: var(--vscode-editor-font-family);
  --vscode-font-size: var(--vscode-editor-font-size);
  --vscode-line-height: var(--vscode-editor-line-height);
}

/* Uso de variables de tema */
.workbench {
  color: var(--vscode-foreground);
  background-color: var(--vscode-editor-background);
  font-family: var(--vscode-font-family);
}

/* Variables específicas por componente */
.sidebar {
  --sidebar-width: 240px;
  --sidebar-min-width: 120px;
  --sidebar-max-width: 50vw;
  
  width: var(--sidebar-width);
  min-width: var(--sidebar-min-width);
  max-width: var(--sidebar-max-width);
  background-color: var(--vscode-sideBar-background);
}
```

### CSS Modules Pattern

```css
/* editor/media/editorpart.css */
.editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.editor-container .editor-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-container .editor-group .editor-instance {
  flex: 1;
  overflow: hidden;
}
```

### Responsive Design System

```css
/* Breakpoints del sistema */
@media (max-width: 1200px) {
  .workbench.sidebar {
    --sidebar-width: 200px;
  }
}

@media (max-width: 900px) {
  .workbench.sidebar {
    --sidebar-width: 180px;
  }
}

@media (max-width: 600px) {
  .workbench {
    --panel-position: overlay;
  }
  
  .sidebar {
    position: absolute;
    z-index: 100;
  }
}
```

### CSS-in-JS Integration

```typescript
// Generación dinámica de estilos
class StyledComponent extends Disposable {
  private styleElement: HTMLStyleElement;
  
  constructor(
    @IThemeService private readonly themeService: IThemeService
  ) {
    super();
    
    this.styleElement = dom.createStyleSheet();
    this.updateStyles();
    
    this._register(this.themeService.onDidColorThemeChange(() => {
      this.updateStyles();
    }));
  }
  
  private updateStyles(): void {
    const theme = this.themeService.getColorTheme();
    const backgroundColor = theme.getColor(editorBackground);
    const foregroundColor = theme.getColor(foreground);
    
    const css = `
      .my-dynamic-component {
        background-color: ${backgroundColor};
        color: ${foregroundColor};
        border: 1px solid ${theme.getColor(contrastBorder)};
      }
    `;
    
    this.styleElement.textContent = css;
  }
}
```

### Animation & Transitions

```css
/* Sistema de animaciones coherente */
.smooth-transition {
  transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Animaciones de panel */
.panel-slide {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-slide.collapsed {
  transform: translateX(-100%);
}
```

---

## Sistema de Layout y Renderizado

### 📐 Grid System Architecture

VS Code utiliza un sistema de grillas sofisticado para layout dinámico:

### Archivos Clave

```typescript
// Sistema de grillas:
/src/vs/base/browser/ui/grid/grid.ts
/src/vs/base/browser/ui/splitview/splitview.ts
/src/vs/workbench/browser/layout.ts
```

### Grid Implementation

```typescript
// Interfaz del sistema de grillas
interface ISerializableView extends IView {
  readonly element: HTMLElement;
  readonly minimumWidth: number;
  readonly maximumWidth: number;
  readonly minimumHeight: number;
  readonly maximumHeight: number;
  
  layout(width: number, height: number, orientation: Orientation): void;
  serialize(): ISerializedView;
}

// Grid container
class Grid extends Disposable implements ISerializableView {
  private root: GridNode;
  private views: Map<IView, GridLocation> = new Map();
  
  constructor(view: ISerializableView) {
    super();
    this.root = new GridLeafNode(view);
  }
  
  addView(view: ISerializableView, size: number, location: GridLocation): void {
    const node = this.getNode(location);
    // Lógica para agregar vista al grid
  }
  
  removeView(location: GridLocation): void {
    const node = this.getNode(location);
    // Lógica para remover vista del grid
  }
  
  layout(width: number, height: number): void {
    this.root.layout(width, height);
  }
}
```

### SplitView System

```typescript
// Sistema de vistas divididas
class SplitView extends Disposable {
  private views: ISplitViewItem[] = [];
  private sashContainer: HTMLElement;
  
  addView(view: IView, size: number, index?: number): void {
    const item = {
      view,
      size,
      minimumSize: view.minimumSize,
      maximumSize: view.maximumSize
    };
    
    this.views.splice(index ?? this.views.length, 0, item);
    this.relayout();
  }
  
  removeView(index: number): void {
    const item = this.views.splice(index, 1)[0];
    item.view.dispose();
    this.relayout();
  }
  
  resizeView(index: number, size: number): void {
    this.views[index].size = size;
    this.relayout();
  }
}
```

### Layout Service Implementation

```typescript
// Servicio principal de layout
class LayoutService extends Disposable implements ILayoutService {
  private readonly parts = new Map<Parts, Part>();
  private workbenchGrid!: SerializableGrid<ISerializableView>;
  
  constructor(
    @IStorageService private readonly storageService: IStorageService,
    @IThemeService private readonly themeService: IThemeService
  ) {
    super();
    this.initializeLayout();
  }
  
  private initializeLayout(): void {
    // Crear grid principal
    this.workbenchGrid = new SerializableGrid(this.createMainView());
    
    // Agregar partes al grid
    this.addPart(Parts.TITLEBAR_PART, this.createTitlebarPart());
    this.addPart(Parts.ACTIVITYBAR_PART, this.createActivitybarPart());
    this.addPart(Parts.SIDEBAR_PART, this.createSidebarPart());
    this.addPart(Parts.EDITOR_PART, this.createEditorPart());
    this.addPart(Parts.PANEL_PART, this.createPanelPart());
    this.addPart(Parts.STATUSBAR_PART, this.createStatusbarPart());
  }
  
  togglePartVisibility(part: Parts): void {
    const partView = this.parts.get(part);
    if (partView) {
      const isVisible = this.isVisible(part);
      if (isVisible) {
        this.hidePart(part);
      } else {
        this.showPart(part);
      }
    }
  }
  
  resizePart(part: Parts, size: number): void {
    const location = this.getPartLocation(part);
    this.workbenchGrid.resizeView(location, size);
  }
}
```

### View System

```typescript
// Sistema de vistas y contenedores
interface IViewDescriptor {
  readonly id: string;
  readonly name: string;
  readonly containerIcon?: ThemeIcon;
  readonly containerTitle?: string;
  readonly order?: number;
  readonly weight?: number;
  readonly collapsed?: boolean;
  readonly canToggleVisibility?: boolean;
  readonly hideByDefault?: boolean;
  readonly workspace?: boolean;
}

// ViewContainer
interface IViewContainer {
  readonly id: string;
  readonly title: string;
  readonly icon?: ThemeIcon;
  readonly order?: number;
  readonly ctorDescriptor: SyncDescriptor<IView>;
  readonly storageId?: string;
  readonly hideIfEmpty?: boolean;
}

// Registro de vista
Registry.add(Extensions.ViewsRegistry, new class implements IViewsRegistry {
  registerViews(views: IViewDescriptor[], viewContainer: ViewContainer): void {
    // Lógica de registro
  }
  
  registerViewWelcomeContent(id: string, viewContent: IViewWelcomeContent): void {
    // Lógica de contenido de bienvenida
  }
});
```

### Responsive Layout

```typescript
// Layout responsivo
class ResponsiveLayoutController extends Disposable {
  private breakpoints = {
    small: 600,
    medium: 900,
    large: 1200,
    xlarge: 1600
  };
  
  constructor(
    @ILayoutService private readonly layoutService: ILayoutService
  ) {
    super();
    
    this._register(dom.addDisposableListener(window, 'resize', () => {
      this.handleResize();
    }));
  }
  
  private handleResize(): void {
    const width = window.innerWidth;
    
    if (width < this.breakpoints.small) {
      this.applySmallLayout();
    } else if (width < this.breakpoints.medium) {
      this.applyMediumLayout();
    } else if (width < this.breakpoints.large) {
      this.applyLargeLayout();
    } else {
      this.applyXLargeLayout();
    }
  }
  
  private applySmallLayout(): void {
    // Ocultar sidebar por defecto
    this.layoutService.setPartHidden(Parts.SIDEBAR_PART, true);
    // Panel en modo overlay
    this.layoutService.setPanelPosition(Position.BOTTOM);
  }
}
```

---

## Servicios Core

### ⚙️ Core Services Architecture

Los servicios core proporcionan funcionalidad fundamental para toda la aplicación:

### Editor Services

```typescript
// Ubicación: /src/vs/workbench/services/editor/

interface IEditorService extends IService {
  readonly onDidActiveEditorChange: Event<void>;
  readonly onDidVisibleEditorsChange: Event<void>;
  readonly onDidCloseEditor: Event<IEditorCloseEvent>;
  readonly onDidOpenEditorFail: Event<IEditorOpenFailureEvent>;
  
  readonly activeEditor: IEditorInput | undefined;
  readonly activeEditorPane: IEditorPane | undefined;
  readonly activeTextEditorControl: IEditor | undefined;
  
  openEditor(editor: IEditorInput, options?: IEditorOptions, group?: IEditorGroup | GroupIdentifier): Promise<IEditorPane | undefined>;
  openEditors(editors: IEditorInputWithOptions[], group?: IEditorGroup | GroupIdentifier): Promise<IEditorPane[]>;
  closeEditor(editor: IEditorInput, group?: IEditorGroup | GroupIdentifier): Promise<void>;
  closeEditors(editors: IEditorInput[], group?: IEditorGroup | GroupIdentifier): Promise<void>;
}

// Editor Groups Service
interface IEditorGroupsService extends IService {
  readonly onDidActiveGroupChange: Event<IEditorGroup>;
  readonly onDidAddGroup: Event<IEditorGroup>;
  readonly onDidRemoveGroup: Event<IEditorGroup>;
  readonly onDidMoveGroup: Event<IEditorGroup>;
  
  readonly activeGroup: IEditorGroup;
  readonly count: number;
  readonly groups: readonly IEditorGroup[];
  
  getGroup(identifier: GroupIdentifier): IEditorGroup | undefined;
  createEditorGroup(direction: GroupDirection, options?: IEditorGroupCreationOptions): IEditorGroup;
  removeGroup(group: IEditorGroup): void;
  moveGroup(group: IEditorGroup, location: GroupLocation): void;
}
```

### View Services

```typescript
// Ubicación: /src/vs/workbench/services/views/

interface IViewsService extends IService {
  readonly onDidChangeViewVisibility: Event<{ id: string; visible: boolean }>;
  readonly onDidChangeViewContainerVisibility: Event<{ id: string; visible: boolean; location: ViewContainerLocation }>;
  
  openView<T = IView>(id: string, focus?: boolean): Promise<T | null>;
  closeView(id: string): void;
  getViewWithId<T = IView>(id: string): T | null;
  isViewVisible(id: string): boolean;
  
  getViewContainer(viewId: string): ViewContainer | null;
  getViewContainerLocation(container: ViewContainer): ViewContainerLocation | null;
}

// View Descriptor Service
interface IViewDescriptorService extends IService {
  readonly onDidChangeContainer: Event<{ views: IViewDescriptor[]; from: ViewContainer; to: ViewContainer }>;
  readonly onDidChangeLocation: Event<{ views: IViewDescriptor[]; from: ViewContainerLocation; to: ViewContainerLocation }>;
  
  getViewDescriptorById(viewId: string): IViewDescriptor | null;
  getViewContainerById(viewContainerId: string): ViewContainer | null;
  getViewContainersByLocation(location: ViewContainerLocation): ViewContainer[];
  
  moveViewsToContainer(views: IViewDescriptor[], viewContainer: ViewContainer): void;
  moveViewToLocation(view: IViewDescriptor, location: ViewContainerLocation): void;
}
```

### Progress Service

```typescript
// Ubicación: /src/vs/workbench/services/progress/

interface IProgressService extends IService {
  withProgress<R>(
    options: IProgressOptions,
    task: (progress: IProgress<IProgressStep>) => Promise<R>
  ): Promise<R>;
}

interface IProgressOptions {
  location: ProgressLocation | { viewId: string };
  title?: string;
  source?: string | { label: string; id: string };
  total?: number;
  cancellable?: boolean;
  buttons?: string[];
  delay?: number;
}

// Uso del servicio de progreso
class MyService {
  constructor(
    @IProgressService private readonly progressService: IProgressService
  ) {}
  
  async performLongTask(): Promise<void> {
    await this.progressService.withProgress({
      location: ProgressLocation.Notification,
      title: 'Performing long task...',
      cancellable: true
    }, async (progress, token) => {
      for (let i = 0; i < 100; i++) {
        if (token.isCancellationRequested) {
          break;
        }
        
        // Simular trabajo
        await new Promise(resolve => setTimeout(resolve, 100));
        
        progress.report({
          increment: 1,
          message: `Step ${i + 1} of 100`
        });
      }
    });
  }
}
```

### Notification Service

```typescript
// Ubicación: /src/vs/platform/notification/

interface INotificationService extends IService {
  readonly onDidAddNotification: Event<INotification>;
  readonly onDidRemoveNotification: Event<INotification>;
  
  info(message: string | Error): void;
  warn(message: string | Error): void;
  error(message: string | Error): void;
  
  notify(notification: INotificationProperties): INotificationHandle;
  prompt(severity: Severity, message: string, choices: IPromptChoice[]): INotificationHandle;
}

// Tipos de notificaciones
interface INotificationProperties {
  severity: Severity;
  message: string | Error;
  source?: string | NotificationSource;
  actions?: INotificationActions;
  sticky?: boolean;
  silent?: boolean;
}

// Uso del servicio
class MyService {
  constructor(
    @INotificationService private readonly notificationService: INotificationService
  ) {}
  
  showCustomNotification(): void {
    const handle = this.notificationService.notify({
      severity: Severity.Info,
      message: 'Custom notification message',
      actions: {
        primary: [
          {
            id: 'action1',
            label: 'Action 1',
            run: () => {
              // Lógica de acción
            }
          }
        ],
        secondary: [
          {
            id: 'action2',
            label: 'Action 2',
            run: () => {
              // Lógica de acción secundaria
            }
          }
        ]
      }
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => handle.close(), 5000);
  }
}
```

### Dialog Service

```typescript
// Ubicación: /src/vs/platform/dialogs/

interface IDialogService extends IService {
  confirm(confirmation: IConfirmation): Promise<IConfirmationResult>;
  show(severity: Severity, message: string, buttons?: string[], options?: IDialogOptions): Promise<IShowResult>;
  about(): Promise<void>;
}

interface IConfirmation {
  title?: string;
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  message: string;
  detail?: string;
  primaryButton?: string;
  secondaryButton?: string;
  checkbox?: ICheckbox;
}

// Ejemplo de confirmación
class MyService {
  constructor(
    @IDialogService private readonly dialogService: IDialogService
  ) {}
  
  async confirmDeletion(): Promise<boolean> {
    const result = await this.dialogService.confirm({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this item?',
      detail: 'This action cannot be undone.',
      primaryButton: 'Delete',
      secondaryButton: 'Cancel',
      type: 'warning'
    });
    
    return result.confirmed;
  }
}
```

---

## Configuración y Puntos de Extensión

### 🔧 Extension Points & Configuration

VS Code proporciona múltiples puntos de extensión para personalizar la UI:

### View Contributions

```json
// package.json - Definición de vistas
{
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "myCustomView",
          "name": "My Custom View",
          "when": "myExtension.enabled",
          "icon": "$(symbol-class)",
          "contextualTitle": "My Extension"
        }
      ]
    },
    "viewsContainers": {
      "activitybar": [
        {
          "id": "myCustomContainer",
          "title": "My Custom Container",
          "icon": "$(extensions)"
        }
      ]
    }
  }
}
```

### Command Contributions

```json
{
  "contributes": {
    "commands": [
      {
        "command": "myExtension.customCommand",
        "title": "My Custom Command",
        "category": "My Extension",
        "icon": "$(add)",
        "enablement": "myExtension.enabled"
      }
    ],
    "menus": {
      "commandPalette": [
        {
          "command": "myExtension.customCommand",
          "when": "myExtension.enabled"
        }
      ],
      "view/title": [
        {
          "command": "myExtension.customCommand",
          "when": "view == myCustomView",
          "group": "navigation"
        }
      ]
    }
  }
}
```

### ViewPane Implementation

```typescript
// Implementación de vista personalizada
import { ViewPane, IViewPaneOptions } from 'vs/workbench/browser/parts/views/viewPane';

class MyCustomViewPane extends ViewPane {
  static readonly ID = 'myCustomView';
  
  private tree: WorkbenchAsyncDataTree<any, any, any> | undefined;
  
  constructor(
    options: IViewPaneOptions,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IThemeService themeService: IThemeService,
    @ITelemetryService telemetryService: ITelemetryService
  ) {
    super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
  }
  
  protected renderBody(container: HTMLElement): void {
    super.renderBody(container);
    
    const treeContainer = dom.append(container, dom.$('.tree-container'));
    
    this.tree = this.instantiationService.createInstance(
      WorkbenchAsyncDataTree,
      'MyCustomView',
      treeContainer,
      new MyTreeDelegate(),
      [new MyTreeRenderer()],
      new MyDataSource(),
      {
        identityProvider: new MyIdentityProvider(),
        sorter: new MySorter(),
        filter: new MyFilter(),
        accessibilityProvider: new MyAccessibilityProvider()
      }
    );
    
    this._register(this.tree);
  }
  
  protected layoutBody(height: number, width: number): void {
    super.layoutBody(height, width);
    this.tree?.layout(height, width);
  }
  
  focus(): void {
    super.focus();
    this.tree?.domFocus();
  }
}
```

### Tree Data Provider

```typescript
// Proveedor de datos para árbol
class MyDataSource implements IAsyncDataSource<any, any> {
  hasChildren(element: any): boolean {
    return element.children && element.children.length > 0;
  }
  
  getChildren(element: any): Promise<any[]> {
    if (!element) {
      return Promise.resolve(this.getRootElements());
    }
    return Promise.resolve(element.children || []);
  }
  
  private getRootElements(): any[] {
    return [
      { id: '1', label: 'Item 1', children: [] },
      { id: '2', label: 'Item 2', children: [
        { id: '2.1', label: 'Subitem 1' },
        { id: '2.2', label: 'Subitem 2' }
      ]}
    ];
  }
}

// Renderer para elementos del árbol
class MyTreeRenderer implements ITreeRenderer<any, any, any> {
  static readonly TEMPLATE_ID = 'myTreeItem';
  
  get templateId(): string {
    return MyTreeRenderer.TEMPLATE_ID;
  }
  
  renderTemplate(container: HTMLElement): any {
    const element = dom.append(container, dom.$('.custom-tree-item'));
    const icon = dom.append(element, dom.$('.icon'));
    const label = dom.append(element, dom.$('.label'));
    
    return { element, icon, label };
  }
  
  renderElement(element: ITreeNode<any, any>, index: number, templateData: any): void {
    const { icon, label } = templateData;
    
    icon.className = 'icon ' + (element.element.icon || 'codicon-file');
    label.textContent = element.element.label;
  }
  
  disposeTemplate(templateData: any): void {
    // Cleanup si es necesario
  }
}
```

### Keybinding Contributions

```json
{
  "contributes": {
    "keybindings": [
      {
        "command": "myExtension.customCommand",
        "key": "ctrl+shift+m",
        "mac": "cmd+shift+m",
        "when": "editorTextFocus && myExtension.enabled"
      }
    ]
  }
}
```

### Context Key Contributions

```typescript
// Definición de context keys
export const MyExtensionEnabled = new RawContextKey<boolean>('myExtension.enabled', false);
export const MyExtensionHasData = new RawContextKey<boolean>('myExtension.hasData', false);

// Uso en extensión
export class MyExtension {
  private myExtensionEnabled: IContextKey<boolean>;
  private myExtensionHasData: IContextKey<boolean>;
  
  constructor(
    @IContextKeyService contextKeyService: IContextKeyService
  ) {
    this.myExtensionEnabled = MyExtensionEnabled.bindTo(contextKeyService);
    this.myExtensionHasData = MyExtensionHasData.bindTo(contextKeyService);
    
    // Activar la extensión
    this.myExtensionEnabled.set(true);
  }
  
  updateDataContext(hasData: boolean): void {
    this.myExtensionHasData.set(hasData);
  }
}
```

---

## Performance y Seguridad

### ⚡ Performance Optimization

### Lazy Loading Implementation

```typescript
// Lazy loading de componentes
class LazyComponentLoader {
  private static componentCache = new Map<string, Promise<any>>();
  
  static async loadComponent<T>(id: string, loader: () => Promise<T>): Promise<T> {
    if (!this.componentCache.has(id)) {
      this.componentCache.set(id, loader());
    }
    return this.componentCache.get(id)!;
  }
}

// Uso en vista
class MyViewPane extends ViewPane {
  private async createHeavyComponent(): Promise<IHeavyComponent> {
    return LazyComponentLoader.loadComponent('heavyComponent', async () => {
      const module = await import('./heavyComponent');
      return this.instantiationService.createInstance(module.HeavyComponent);
    });
  }
}
```

### Virtual Scrolling

```typescript
// Implementación de virtual scrolling para listas grandes
import { IListVirtualDelegate } from 'vs/base/browser/ui/list/list';

class VirtualScrollingDelegate implements IListVirtualDelegate<any> {
  getHeight(element: any): number {
    return 22; // Altura fija por elemento
  }
  
  getTemplateId(element: any): string {
    return 'virtualItem';
  }
}

// Lista virtual
class MyVirtualList extends Disposable {
  private list: List<any>;
  
  constructor(
    container: HTMLElement,
    @IInstantiationService instantiationService: IInstantiationService
  ) {
    super();
    
    this.list = instantiationService.createInstance(
      List,
      'MyVirtualList',
      container,
      new VirtualScrollingDelegate(),
      [new MyVirtualRenderer()],
      {
        enableKeyboardNavigation: true,
        horizontalScrolling: false,
        supportDynamicHeights: false
      }
    );
    
    this._register(this.list);
  }
  
  setElements(elements: any[]): void {
    // Solo renderizar elementos visibles
    this.list.splice(0, this.list.length, ...elements);
  }
}
```

### Memory Management

```typescript
// Gestión de memoria con disposables
class MemoryAwareComponent extends Disposable {
  private resourceCache = new Map<string, IDisposable>();
  private readonly maxCacheSize = 100;
  
  constructor() {
    super();
    
    // Limpiar caché periódicamente
    this._register(setInterval(() => {
      this.cleanupCache();
    }, 60000)); // Cada minuto
  }
  
  private cleanupCache(): void {
    if (this.resourceCache.size > this.maxCacheSize) {
      const entries = Array.from(this.resourceCache.entries());
      const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
      
      toRemove.forEach(([key, disposable]) => {
        disposable.dispose();
        this.resourceCache.delete(key);
      });
    }
  }
  
  getResource(key: string, factory: () => IDisposable): IDisposable {
    if (!this.resourceCache.has(key)) {
      const resource = factory();
      this.resourceCache.set(key, resource);
      
      // Auto-cleanup cuando el recurso se dispone
      resource.onDispose?.(() => {
        this.resourceCache.delete(key);
      });
    }
    
    return this.resourceCache.get(key)!;
  }
}
```

### 🔐 Security Considerations

### Content Security Policy

```typescript
// CSP para webviews
class SecureWebviewPanel {
  private static readonly CSP = `
    default-src 'none';
    script-src 'unsafe-inline' 'unsafe-eval';
    style-src 'unsafe-inline';
    img-src https: data: blob:;
    font-src https: data:;
    connect-src https:;
  `.replace(/\s+/g, ' ').trim();
  
  createWebview(options: any): Webview {
    const webview = new Webview({
      ...options,
      contentSecurityPolicy: SecureWebviewPanel.CSP
    });
    
    // Sanitizar contenido antes de mostrarlo
    webview.onMessage(message => {
      this.handleMessage(this.sanitizeMessage(message));
    });
    
    return webview;
  }
  
  private sanitizeMessage(message: any): any {
    // Implementar sanitización según necesidades
    return message;
  }
}
```

### Input Sanitization

```typescript
// Sanitización de inputs
class InputSanitizer {
  static sanitizeHtml(html: string): string {
    // Usar DOMPurify o implementación personalizada
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
  }
  
  static sanitizeFilePath(path: string): string {
    // Prevenir path traversal
    return path
      .replace(/\.\./g, '')
      .replace(/[<>:"|?*]/g, '')
      .trim();
  }
  
  static sanitizeCommand(command: string): boolean {
    // Lista de comandos permitidos
    const allowedCommands = new Set([
      'editor.action.selectAll',
      'editor.action.copy',
      'editor.action.paste'
    ]);
    
    return allowedCommands.has(command);
  }
}
```

### Secure Communication

```typescript
// Comunicación segura entre componentes
class SecureMessageBus extends Disposable {
  private readonly channels = new Map<string, MessageChannel>();
  private readonly validators = new Map<string, (message: any) => boolean>();
  
  createChannel(channelId: string, validator?: (message: any) => boolean): MessageChannel {
    if (this.channels.has(channelId)) {
      throw new Error(`Channel ${channelId} already exists`);
    }
    
    const channel = new MessageChannel();
    this.channels.set(channelId, channel);
    
    if (validator) {
      this.validators.set(channelId, validator);
    }
    
    // Interceptar mensajes para validación
    channel.port1.onmessage = (event) => {
      if (this.validateMessage(channelId, event.data)) {
        this.handleSecureMessage(channelId, event.data);
      } else {
        console.warn(`Invalid message on channel ${channelId}:`, event.data);
      }
    };
    
    return channel;
  }
  
  private validateMessage(channelId: string, message: any): boolean {
    const validator = this.validators.get(channelId);
    return validator ? validator(message) : true;
  }
}
```

---

## Guía de Implementación Práctica

### 🚀 Practical Implementation Guide

### Paso 1: Crear un Nuevo Part

```typescript
// 1. Crear la clase del Part
import { Part } from 'vs/workbench/browser/part';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { ILayoutService } from 'vs/workbench/services/layout/browser/layoutService';

export class MyCustomPart extends Part {
  static readonly ID = 'workbench.parts.myCustomPart';
  
  private container!: HTMLElement;
  
  constructor(
    @IThemeService themeService: IThemeService,
    @IStorageService storageService: IStorageService,
    @ILayoutService layoutService: ILayoutService
  ) {
    super(MyCustomPart.ID, { hasTitle: true }, themeService, storageService, layoutService);
  }
  
  createContentArea(parent: HTMLElement): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'my-custom-part';
    parent.appendChild(this.container);
    
    this.createContent();
    
    return this.container;
  }
  
  private createContent(): void {
    const title = document.createElement('h2');
    title.textContent = 'My Custom Part';
    this.container.appendChild(title);
    
    const content = document.createElement('div');
    content.className = 'custom-part-content';
    content.textContent = 'Custom content goes here';
    this.container.appendChild(content);
  }
  
  layout(width: number, height: number): void {
    super.layout(width, height);
    
    // Aplicar layout personalizado
    if (this.container) {
      this.container.style.width = width + 'px';
      this.container.style.height = height + 'px';
    }
  }
}
```

### Paso 2: Registrar el Part

```typescript
// 2. Registrar en el workbench
import { Extensions, IWorkbenchContributionsRegistry } from 'vs/workbench/common/contributions';
import { Registry } from 'vs/platform/registry/common/platform';
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle';

// Contribution para inicializar el part
class MyCustomPartContribution implements IWorkbenchContribution {
  constructor(
    @ILayoutService private readonly layoutService: ILayoutService,
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.initializePart();
  }
  
  private initializePart(): void {
    const part = this.instantiationService.createInstance(MyCustomPart);
    
    // Agregar al layout (esto requiere modificar el layout service)
    this.layoutService.registerPart(part);
  }
}

// Registrar la contribution
Registry.as<IWorkbenchContributionsRegistry>(Extensions.Workbench)
  .registerWorkbenchContribution(MyCustomPartContribution, LifecyclePhase.Starting);
```

### Paso 3: Modificar Layout Service

```typescript
// 3. Extender el layout service para soportar el nuevo part
enum Parts {
  TITLEBAR_PART = 'workbench.parts.titlebar',
  ACTIVITYBAR_PART = 'workbench.parts.activitybar',
  SIDEBAR_PART = 'workbench.parts.sidebar',
  PANEL_PART = 'workbench.parts.panel',
  AUXILIARYBAR_PART = 'workbench.parts.auxiliarybar',
  EDITOR_PART = 'workbench.parts.editor',
  STATUSBAR_PART = 'workbench.parts.statusbar',
  MYCUSTOM_PART = 'workbench.parts.myCustomPart' // ← Nuevo part
}

// Extender el layout service
class ExtendedLayoutService extends LayoutService {
  private myCustomPart!: MyCustomPart;
  
  protected initializeLayout(): void {
    super.initializeLayout();
    
    // Crear el custom part
    this.myCustomPart = this.instantiationService.createInstance(MyCustomPart);
    
    // Agregarlo al grid principal
    const location = this.workbenchGrid.location(this.editorPart);
    this.workbenchGrid.addView(
      this.myCustomPart,
      200, // tamaño inicial
      location.getDirection(Direction.Right) // posición
    );
  }
  
  isVisible(part: Parts): boolean {
    if (part === Parts.MYCUSTOM_PART) {
      return !this.myCustomPart.isHidden;
    }
    return super.isVisible(part);
  }
}
```

### Paso 4: Crear CSS Personalizado

```css
/* 4. Crear estilos para el nuevo part */
/* /src/vs/workbench/browser/parts/myCustomPart/media/myCustomPart.css */

.my-custom-part {
  display: flex;
  flex-direction: column;
  background-color: var(--vscode-sideBar-background);
  border-left: 1px solid var(--vscode-sideBar-border);
}

.my-custom-part h2 {
  padding: 10px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-sideBarTitle-foreground);
  background-color: var(--vscode-sideBarSectionHeader-background);
  border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
}

.custom-part-content {
  flex: 1;
  padding: 10px;
  color: var(--vscode-sideBar-foreground);
  overflow-y: auto;
}

/* Responsive design */
@media (max-width: 900px) {
  .my-custom-part {
    min-width: 180px;
  }
}

@media (max-width: 600px) {
  .my-custom-part {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  }
}
```

### Paso 5: Agregar Comandos y Menús

```typescript
// 5. Registrar comandos relacionados
import { CommandsRegistry } from 'vs/platform/commands/common/commands';
import { MenuRegistry, MenuId } from 'vs/platform/actions/common/actions';

// Comando para toggle visibility
CommandsRegistry.registerCommand({
  id: 'workbench.action.toggleMyCustomPart',
  handler: (accessor) => {
    const layoutService = accessor.get(ILayoutService);
    layoutService.togglePartVisibility(Parts.MYCUSTOM_PART);
  }
});

// Agregar al menú View
MenuRegistry.appendMenuItem(MenuId.MenubarViewMenu, {
  group: '3_views',
  command: {
    id: 'workbench.action.toggleMyCustomPart',
    title: 'Toggle My Custom Part'
  },
  order: 10
});

// Context key para controlar visibilidad
const MyCustomPartVisibleContext = new RawContextKey<boolean>('myCustomPartVisible', true);
```

### Paso 6: Integrar con Temas

```typescript
// 6. Definir colores personalizados para el part
import { registerColor } from 'vs/platform/theme/common/colorRegistry';

export const myCustomPartBackground = registerColor(
  'myCustomPart.background',
  { dark: '#1E1E1E', light: '#F3F3F3', hcDark: '#000000', hcLight: '#FFFFFF' },
  'Background color for my custom part'
);

export const myCustomPartBorder = registerColor(
  'myCustomPart.border',
  { dark: '#2D2D30', light: '#E5E5E5', hcDark: '#6FC3DF', hcLight: '#0F4A85' },
  'Border color for my custom part'
);

// Usar en el componente
class MyCustomPart extends Part {
  protected updateStyles(): void {
    super.updateStyles();
    
    const backgroundColor = this.getColor(myCustomPartBackground);
    const borderColor = this.getColor(myCustomPartBorder);
    
    if (this.container) {
      this.container.style.backgroundColor = backgroundColor ? backgroundColor.toString() : '';
      this.container.style.borderColor = borderColor ? borderColor.toString() : '';
    }
  }
}
```

### Paso 7: Testing

```typescript
// 7. Crear tests para el nuevo part
import { TestInstantiationService } from 'vs/platform/instantiation/test/common/instantiationServiceMock';
import { MyCustomPart } from '../myCustomPart';

suite('MyCustomPart', () => {
  let instantiationService: TestInstantiationService;
  let part: MyCustomPart;
  
  setup(() => {
    instantiationService = new TestInstantiationService();
    // Mock servicios necesarios
    instantiationService.stub(IThemeService, {});
    instantiationService.stub(IStorageService, {});
    instantiationService.stub(ILayoutService, {});
    
    part = instantiationService.createInstance(MyCustomPart);
  });
  
  teardown(() => {
    part.dispose();
  });
  
  test('should create content area', () => {
    const parent = document.createElement('div');
    const contentArea = part.createContentArea(parent);
    
    assert.ok(contentArea);
    assert.ok(contentArea.classList.contains('my-custom-part'));
  });
  
  test('should handle layout changes', () => {
    const parent = document.createElement('div');
    part.createContentArea(parent);
    
    part.layout(300, 200);
    
    // Verificar que el layout se aplicó correctamente
    assert.strictEqual(part.container.style.width, '300px');
    assert.strictEqual(part.container.style.height, '200px');
  });
});
```

### Checklist de Implementación

#### ✅ **Checklist para Nuevos Parts**

- [ ] Crear clase que extienda `Part`
- [ ] Implementar `createContentArea()`
- [ ] Implementar `layout()` method
- [ ] Registrar en `IWorkbenchContribution`
- [ ] Agregar enum a `Parts`
- [ ] Crear archivos CSS correspondientes
- [ ] Definir colores de tema personalizados
- [ ] Registrar comandos para controlar el part
- [ ] Agregar context keys si es necesario
- [ ] Crear tests unitarios
- [ ] Documentar la funcionalidad
- [ ] Verificar responsive design
- [ ] Probar con diferentes temas
- [ ] Validar accesibilidad

#### ✅ **Checklist para Vistas Personalizadas**

- [ ] Implementar `IViewDescriptor`
- [ ] Crear clase que extienda `ViewPane`
- [ ] Implementar tree data provider si es necesario
- [ ] Registrar en `ViewsRegistry`
- [ ] Definir contribuciones en package.json
- [ ] Crear comandos específicos de la vista
- [ ] Implementar context menu actions
- [ ] Agregar welcome content si aplica
- [ ] Testear integración con view containers
- [ ] Verificar persistence de estado

---

*Este documento proporciona una guía completa para modificar y extender la UI de VS Code. Cada sección incluye ejemplos prácticos y código funcional que puedes adaptar a tus necesidades específicas.*