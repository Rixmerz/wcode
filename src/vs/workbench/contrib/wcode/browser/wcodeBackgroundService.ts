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

export const IWCodeBackgroundService = createDecorator<IWCodeBackgroundService>('wcodeBackgroundService');

export interface IWCodeBackgroundService {
	readonly _serviceBrand: undefined;
	applyBackgroundSettings(): void;
	removeBackground(): void;
}

export class WCodeBackgroundService extends Disposable implements IWCodeBackgroundService, IWorkbenchContribution {
	readonly _serviceBrand: undefined;

	private backgroundElement: HTMLElement | null = null;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IThemeService private readonly themeService: IThemeService
	) {
		super();
		this.init();
	}

	private init(): void {
		// Listen for configuration changes
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('wcode.background')) {
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
		const config = this.configurationService.getValue<any>('wcode.background');

		if (!config?.enabled || !config?.image) {
			this.removeBackground();
			return;
		}

		this.createBackgroundElement();
		this.updateBackgroundStyles(config);
	}

	private createBackgroundElement(): void {
		if (this.backgroundElement) {
			return;
		}

		// Find the workbench container
		const workbench = document.querySelector('.monaco-workbench');
		if (!workbench) {
			return;
		}

		// Create background element
		this.backgroundElement = document.createElement('div');
		this.backgroundElement.className = 'wcode-background';
		this.backgroundElement.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: -1;
			pointer-events: none;
		`;

		workbench.appendChild(this.backgroundElement);
	}

	private updateBackgroundStyles(config: any): void {
		if (!this.backgroundElement) {
			return;
		}

		const opacity = config.opacity || 0.1;
		const size = config.size || 'cover';
		const position = config.position || 'center';
		const image = config.image;

		this.backgroundElement.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: -1;
			pointer-events: none;
			background-image: url('${image}');
			background-size: ${size};
			background-position: ${position};
			background-repeat: no-repeat;
			opacity: ${opacity};
		`;
	}

	removeBackground(): void {
		if (this.backgroundElement) {
			this.backgroundElement.remove();
			this.backgroundElement = null;
		}
	}

	override dispose(): void {
		this.removeBackground();
		super.dispose();
	}
}

registerSingleton(IWCodeBackgroundService, WCodeBackgroundService, InstantiationType.Eager);
