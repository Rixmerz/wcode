/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from '../../../../platform/registry/common/platform.js';
import { IConfigurationRegistry, Extensions as ConfigurationExtensions, ConfigurationScope } from '../../../../platform/configuration/common/configurationRegistry.js';
import { localize } from '../../../../nls.js';
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from '../../../common/contributions.js';
import { LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { WCodeBackgroundService } from './wcodeBackgroundService.js';
import { WCodeTerminalService } from './wcodeTerminalService.js';

// Register WCode-specific configuration settings
const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);

configurationRegistry.registerConfiguration({
	id: 'wcode',
	order: 7,
	title: localize('wcodeConfigurationTitle', "WCode"),
	type: 'object',
	properties: {
		'wcode.transparency.enabled': {
			type: 'boolean',
			default: false,
			description: localize('wcode.transparency.enabled', "Enable window transparency for WCode."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.transparency.opacity': {
			type: 'number',
			default: 1.0,
			minimum: 0.1,
			maximum: 1.0,
			description: localize('wcode.transparency.opacity', "Set the window opacity level (0.1 = very transparent, 1.0 = fully opaque)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.enabled': {
			type: 'boolean',
			default: false,
			description: localize('wcode.background.enabled', "Enable custom background images for the editor."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.image': {
			type: 'string',
			default: '',
			description: localize('wcode.background.image', "Path to the background image file (supports local files and URLs)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.opacity': {
			type: 'number',
			default: 0.1,
			minimum: 0.01,
			maximum: 1.0,
			description: localize('wcode.background.opacity', "Set the background image opacity (0.01 = very faint, 1.0 = fully opaque)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.size': {
			type: 'string',
			enum: ['cover', 'contain', 'auto', 'stretch'],
			default: 'cover',
			description: localize('wcode.background.size', "How the background image should be sized."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.position': {
			type: 'string',
			enum: ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
			default: 'center',
			description: localize('wcode.background.position', "Position of the background image."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.terminal.customTheme.enabled': {
			type: 'boolean',
			default: false,
			description: localize('wcode.terminal.customTheme.enabled', "Enable enhanced terminal theming options."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.terminal.customTheme.background': {
			type: 'string',
			default: '',
			description: localize('wcode.terminal.customTheme.background', "Custom background color for the terminal (hex color code)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.terminal.customTheme.foreground': {
			type: 'string',
			default: '',
			description: localize('wcode.terminal.customTheme.foreground', "Custom foreground color for the terminal (hex color code)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.terminal.customTheme.cursor': {
			type: 'string',
			default: '',
			description: localize('wcode.terminal.customTheme.cursor', "Custom cursor color for the terminal (hex color code)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.terminal.customTheme.selection': {
			type: 'string',
			default: '',
			description: localize('wcode.terminal.customTheme.selection', "Custom selection background color for the terminal (hex color code)."),
			scope: ConfigurationScope.APPLICATION
		}
	}
});

// Also register these settings under the window configuration for transparency
configurationRegistry.registerConfiguration({
	id: 'window',
	type: 'object',
	properties: {
		'window.transparency.enabled': {
			type: 'boolean',
			default: false,
			description: localize('window.transparency.enabled', "Enable window transparency."),
			scope: ConfigurationScope.APPLICATION
		},
		'window.transparency.opacity': {
			type: 'number',
			default: 1.0,
			minimum: 0.1,
			maximum: 1.0,
			description: localize('window.transparency.opacity', "Set the window opacity level."),
			scope: ConfigurationScope.APPLICATION
		}
	}
});

// Register WCode services as workbench contributions
const workbenchRegistry = Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench);
workbenchRegistry.registerWorkbenchContribution(WCodeBackgroundService, LifecyclePhase.Restored);
workbenchRegistry.registerWorkbenchContribution(WCodeTerminalService, LifecyclePhase.Restored);
