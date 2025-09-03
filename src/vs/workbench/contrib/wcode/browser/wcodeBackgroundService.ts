/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { mainWindow } from '../../../../base/browser/window.js';

export const IWCodeBackgroundService = createDecorator<IWCodeBackgroundService>('wcodeBackgroundService');

export interface IWCodeBackgroundService {
	readonly _serviceBrand: undefined;
	applyBackgroundSettings(): void;
	removeBackground(): void;
}

export class WCodeBackgroundService extends Disposable implements IWCodeBackgroundService, IWorkbenchContribution {
	readonly _serviceBrand: undefined;

	private editorStyleElement: HTMLStyleElement | null = null;
	private globalBackgroundElement: HTMLElement | null = null;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IThemeService private readonly themeService: IThemeService
	) {
		super();
		console.log('WCode: WCodeBackgroundService instantiated'); // Debug log
		this.init();
	}

	private init(): void {
		// Listen for configuration changes
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('wcode.background.global') ||
				e.affectsConfiguration('wcode.background.editor') ||
				e.affectsConfiguration('wcode.transparency')) {
				this.applyBackgroundSettings();
			}
		}));

		// Listen for theme changes
		this._register(this.themeService.onDidColorThemeChange(() => {
			this.applyBackgroundSettings();
		}));

		// Apply initial settings
		this.applyBackgroundSettings();
	}

	applyBackgroundSettings(): void {
		// Read individual configuration values to avoid object conversion issues
		const globalEnabled = this.configurationService.getValue<boolean>('wcode.background.global.enabled') ?? false;
		const globalImage = this.configurationService.getValue<string>('wcode.background.global.image') ?? '';
		const globalOpacity = this.configurationService.getValue<number>('wcode.background.global.opacity') ?? 0.1;
		const globalSize = this.configurationService.getValue<string>('wcode.background.global.size') ?? 'cover';
		const globalPosition = this.configurationService.getValue<string>('wcode.background.global.position') ?? 'center';

		const editorEnabled = this.configurationService.getValue<boolean>('wcode.background.editor.enabled') ?? false;
		const editorImage = this.configurationService.getValue<string>('wcode.background.editor.image') ?? '';
		const editorOpacity = this.configurationService.getValue<number>('wcode.background.editor.opacity') ?? 0.1;
		const editorSize = this.configurationService.getValue<string>('wcode.background.editor.size') ?? 'cover';
		const editorPosition = this.configurationService.getValue<string>('wcode.background.editor.position') ?? 'center';


		// Apply global background
		if (globalEnabled && globalImage) {
			this.createGlobalBackgroundElement();
			this.updateGlobalBackgroundStyles({
				enabled: globalEnabled,
				image: globalImage,
				opacity: globalOpacity,
				size: globalSize,
				position: globalPosition
			});
		} else {
			this.removeGlobalBackground();
		}

		// Apply editor background
		if (editorEnabled && editorImage) {
			this.createEditorStyleElement();
			this.updateEditorBackgroundStyles({
				enabled: editorEnabled,
				image: editorImage,
				opacity: editorOpacity,
				size: editorSize,
				position: editorPosition,
				parallax: false
			});
		} else {
			this.removeEditorBackground();
		}
	}

	// Global background methods
	private createGlobalBackgroundElement(): void {
		if (this.globalBackgroundElement) {
			return;
		}

		// Find the workbench container
		const workbench = mainWindow.document.querySelector('.monaco-workbench');
		if (!workbench) {
			return;
		}

		// Make workbench background transparent to show our custom background
		(workbench as HTMLElement).style.background = 'transparent';

		// Create global background element
		this.globalBackgroundElement = mainWindow.document.createElement('div');
		this.globalBackgroundElement.className = 'wcode-global-background';
		this.globalBackgroundElement.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 0;
			pointer-events: none;
		`;

		workbench.appendChild(this.globalBackgroundElement);
	}

	// Editor background methods
	private createEditorStyleElement(): void {
		if (this.editorStyleElement) {
			return;
		}

		this.editorStyleElement = mainWindow.document.createElement('style');
		this.editorStyleElement.id = 'wcode-editor-background';
		mainWindow.document.head.appendChild(this.editorStyleElement);
	}

	private updateGlobalBackgroundStyles(config: any): void {
		if (!this.globalBackgroundElement) {
			return;
		}

		const opacity = config.opacity || 0.1;
		const size = config.size || 'cover';
		const position = config.position || 'center';
		let image = config.image;

		// WCode: Convert local file paths to vscode-file:// scheme
		if (image && !image.startsWith('http') && !image.startsWith('vscode-file://') && !image.startsWith('file://')) {
			// If it's an absolute path, convert to vscode-file:// URL
			if (image.startsWith('/') || image.match(/^[A-Za-z]:\\/)) {
				image = `vscode-file://vscode-app${image}`;
			}
		}

		this.globalBackgroundElement.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 0;
			pointer-events: none;
			background-image: url('${image}');
			background-size: ${size};
			background-position: ${position};
			background-repeat: no-repeat;
			opacity: ${opacity};
		`;
	}

	private updateEditorBackgroundStyles(config: any): void {
		if (!this.editorStyleElement) {
			return;
		}

		const opacity = config.opacity || 0.1;
		const size = config.size || 'cover';
		const position = config.position || 'center';
		const parallax = false; // Parallax removed: always use traditional behavior
		let image = config.image;

		// WCode: Convert local file paths to vscode-file:// scheme
		if (image && !image.startsWith('http') && !image.startsWith('vscode-file://') && !image.startsWith('file://')) {
			// If it's an absolute path, convert to vscode-file:// URL
			if (image.startsWith('/') || image.match(/^[A-Za-z]:\\/)) {
				image = `vscode-file://vscode-app${image}`;
			}
		}

		// CSS to add background only to editor areas
		let css = '';

		if (parallax) {
			// Parallax mode: fixed to viewport, clipped to editor viewport
			css = `
				/* Ensure editor viewport is a positioning context */
				.monaco-editor .overflow-guard { position: relative; }

				/* WCode Editor Background Overlay - Parallax (fixed to viewport) */
				.monaco-editor .overflow-guard::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background-image: url('${image}');
					background-size: ${size};
					background-position: ${position};
					background-repeat: no-repeat;
					background-attachment: fixed; /* fixed to viewport */
					opacity: ${opacity};
					pointer-events: none;
				}

				/* Make editor background transparent to show overlay */
				.monaco-editor .monaco-editor-background { background-color: transparent !important; }
			`;
		} else {
			// Traditional mode: pinned to editor viewport (no scaling with content height)
			css = `
				/* Ensure editor viewport is a positioning context */
				.monaco-editor .overflow-guard { position: relative; }

				/* WCode Editor Background Overlay - Traditional (pinned to editor viewport) */
				.monaco-editor .overflow-guard::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background-image: url('${image}');
					background-size: ${size};
					background-position: ${position};
					background-repeat: no-repeat;
					opacity: ${opacity};
					pointer-events: none;
				}

				/* Make editor background transparent to show overlay */
				.monaco-editor .monaco-editor-background { background-color: transparent !important; }
			`;
		}

		this.editorStyleElement.textContent = css;
	}

	removeGlobalBackground(): void {
		if (this.globalBackgroundElement) {
			this.globalBackgroundElement.remove();
			this.globalBackgroundElement = null;
		}
	}

	removeEditorBackground(): void {
		if (this.editorStyleElement) {
			this.editorStyleElement.remove();
			this.editorStyleElement = null;
		}
	}

	// Interface compatibility method
	removeBackground(): void {
		this.removeGlobalBackground();
		this.removeEditorBackground();
	}

	override dispose(): void {
		this.removeGlobalBackground();
		this.removeEditorBackground();
		super.dispose();
	}
}

registerSingleton(IWCodeBackgroundService, WCodeBackgroundService, InstantiationType.Eager);
