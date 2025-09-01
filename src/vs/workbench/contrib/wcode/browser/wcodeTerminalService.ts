/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export const IWCodeTerminalService = createDecorator<IWCodeTerminalService>('wcodeTerminalService');

export interface IWCodeTerminalService {
	readonly _serviceBrand: undefined;
	applyTerminalCustomization(): void;
	removeTerminalCustomization(): void;
}

export class WCodeTerminalService extends Disposable implements IWCodeTerminalService, IWorkbenchContribution {
	readonly _serviceBrand: undefined;

	private styleElement: HTMLStyleElement | null = null;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();
		this.init();
	}

	private init(): void {
		// Listen for configuration changes
		this._register(this.configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('wcode.terminal.customTheme')) {
				this.applyTerminalCustomization();
			}
		}));

		// Apply initial settings
		this.applyTerminalCustomization();
	}

	applyTerminalCustomization(): void {
		const config = this.configurationService.getValue<any>('wcode.terminal.customTheme');

		if (!config?.enabled) {
			this.removeTerminalCustomization();
			return;
		}

		this.createStyleElement();
		this.updateTerminalStyles(config);
	}

	private createStyleElement(): void {
		if (this.styleElement) {
			return;
		}

		this.styleElement = document.createElement('style');
		this.styleElement.id = 'wcode-terminal-customization';
		document.head.appendChild(this.styleElement);
	}

	private updateTerminalStyles(config: any): void {
		if (!this.styleElement) {
			return;
		}

		let css = '';

		// Custom background color
		if (config.background) {
			css += `
				.terminal-wrapper .xterm-screen,
				.terminal-wrapper .xterm-viewport {
					background-color: ${config.background} !important;
				}
			`;
		}

		// Custom foreground color
		if (config.foreground) {
			css += `
				.terminal-wrapper .xterm-screen {
					color: ${config.foreground} !important;
				}
			`;
		}

		// Custom cursor color
		if (config.cursor) {
			css += `
				.terminal-wrapper .xterm-cursor {
					background-color: ${config.cursor} !important;
				}
			`;
		}

		// Custom selection color
		if (config.selection) {
			css += `
				.terminal-wrapper .xterm-selection {
					background-color: ${config.selection} !important;
				}
			`;
		}

		// Additional terminal enhancements
		css += `
			/* WCode Terminal Enhancements */
			.terminal-wrapper {
				border-radius: 8px;
				overflow: hidden;
			}

			.terminal-wrapper .xterm-screen {
				padding: 8px;
			}

			/* Enhanced scrollbar */
			.terminal-wrapper .xterm-viewport::-webkit-scrollbar {
				width: 8px;
			}

			.terminal-wrapper .xterm-viewport::-webkit-scrollbar-track {
				background: rgba(255, 255, 255, 0.1);
				border-radius: 4px;
			}

			.terminal-wrapper .xterm-viewport::-webkit-scrollbar-thumb {
				background: rgba(255, 255, 255, 0.3);
				border-radius: 4px;
			}

			.terminal-wrapper .xterm-viewport::-webkit-scrollbar-thumb:hover {
				background: rgba(255, 255, 255, 0.5);
			}
		`;

		this.styleElement.textContent = css;
	}

	removeTerminalCustomization(): void {
		if (this.styleElement) {
			this.styleElement.remove();
			this.styleElement = null;
		}
	}

	override dispose(): void {
		this.removeTerminalCustomization();
		super.dispose();
	}
}

registerSingleton(IWCodeTerminalService, WCodeTerminalService, InstantiationType.Eager);
