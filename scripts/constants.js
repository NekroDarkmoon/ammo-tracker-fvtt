// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { A5eTracker } from './systems/a5e.js';
import { Dnd5eTracker } from './systems/dnd5e.js';

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Exports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export const moduleName = 'ammo-tracker-fvtt';
export const moduleTag = 'Ammo Tracker';

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Systems
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export const systemTrackers = {
	a5e: A5eTracker,
	dnd5e: Dnd5eTracker,
};
