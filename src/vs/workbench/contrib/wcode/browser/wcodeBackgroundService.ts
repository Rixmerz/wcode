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
			if (e.affectsConfiguration('wcode.background.global') || e.affectsConfiguration('wcode.background.editor')) {
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
		const globalConfig = this.configurationService.getValue<any>('wcode.background.global');
		const editorConfig = this.configurationService.getValue<any>('wcode.background.editor');

		// Apply global background
		if (globalConfig?.enabled && globalConfig?.image) {
			this.createGlobalBackgroundElement();
			this.updateGlobalBackgroundStyles(globalConfig);
		} else {
			this.removeGlobalBackground();
		}

		// Apply editor background
		if (editorConfig?.enabled && editorConfig?.image) {
			this.createEditorStyleElement();
			this.updateEditorBackgroundStyles(editorConfig);
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
		let image = config.image;

		// WCode: Convert local file paths to vscode-file:// scheme
		if (image && !image.startsWith('http') && !image.startsWith('vscode-file://') && !image.startsWith('file://')) {
			// If it's an absolute path, convert to vscode-file:// URL
			if (image.startsWith('/') || image.match(/^[A-Za-z]:\\/)) {
				image = `vscode-file://vscode-app${image}`;
			}
		}

		// CSS to add background only to editor areas using pseudo-elements
		const css = `
			/* WCode Editor Background Overlay */
			.monaco-editor .monaco-editor-background::before {
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
				z-index: -1;
			}

			/* Alternative selector for different editor layouts */
			.monaco-editor .view-lines::before {
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
				z-index: -1;
			}

			/* Ensure editor background is transparent to show our overlay */
			.monaco-editor .monaco-editor-background {
				background-color: transparent !important;
			}
		`;

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
