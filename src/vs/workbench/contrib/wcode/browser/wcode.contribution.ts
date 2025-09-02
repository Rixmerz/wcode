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

// Register WCode-specific configuration settings
const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);

configurationRegistry.registerConfiguration({
	id: 'wcode',
	order: 7,
	title: localize('wcodeConfigurationTitle', "WCode"),
	type: 'object',
	properties: {
		// Global window background (behind all UI elements)
		'wcode.background.global.enabled': {
			type: 'boolean',
			default: false,
			description: localize('wcode.background.global.enabled', "Enable custom background images for the entire window."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.global.image': {
			type: 'string',
			default: '',
			description: localize('wcode.background.global.image', "Path to the global background image file (supports local files and URLs)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.global.opacity': {
			type: 'number',
			default: 0.1,
			minimum: 0.01,
			maximum: 1.0,
			description: localize('wcode.background.global.opacity', "Set the global background image opacity (0.01 = very faint, 1.0 = fully opaque)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.global.size': {
			type: 'string',
			enum: ['cover', 'contain', 'auto', 'stretch'],
			default: 'cover',
			description: localize('wcode.background.global.size', "How the global background image should be sized."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.global.position': {
			type: 'string',
			enum: ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
			default: 'center',
			description: localize('wcode.background.global.position', "Position of the global background image."),
			scope: ConfigurationScope.APPLICATION
		},

		// Editor-specific background (only behind code editor content)
		'wcode.background.editor.enabled': {
			type: 'boolean',
			default: false,
			description: localize('wcode.background.editor.enabled', "Enable custom background images for the code editor only."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.editor.image': {
			type: 'string',
			default: '',
			description: localize('wcode.background.editor.image', "Path to the editor background image file (supports local files and URLs)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.editor.opacity': {
			type: 'number',
			default: 0.1,
			minimum: 0.01,
			maximum: 1.0,
			description: localize('wcode.background.editor.opacity', "Set the editor background image opacity (0.01 = very faint, 1.0 = fully opaque)."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.editor.size': {
			type: 'string',
			enum: ['cover', 'contain', 'auto', 'stretch'],
			default: 'cover',
			description: localize('wcode.background.editor.size', "How the editor background image should be sized."),
			scope: ConfigurationScope.APPLICATION
		},
		'wcode.background.editor.position': {
			type: 'string',
			enum: ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
			default: 'center',
			description: localize('wcode.background.editor.position', "Position of the editor background image."),
			scope: ConfigurationScope.APPLICATION
		},

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
