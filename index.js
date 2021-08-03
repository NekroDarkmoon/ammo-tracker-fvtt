// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag } from "./scripts/constants.js";
import { registerSettings } from "./scripts/settings.js";
import {Tracker, watcher} from "./scripts/tracker.js"

let Trackers = null;

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                              Main
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Hooks.on('init', async () => {
    await registerSettings();
    console.log(`${moduleTag} | Initialized`);
});


Hooks.on('ready', async () => {    
    Trackers = game.settings.get(moduleName, 'internal-trackers');
    for (let index = 0; index < Trackers.length; index++) {
        const currentTracker = new Trackers[index];
        watcher(currentTracker);
    }
    console.log(`${moduleTag} | Ready`);
});


Hooks.on('createCombat', async (combat) => {
    const currentTracker = new Tracker(combat.data._id);
    currentTracker.startTracking();
    watcher(currentTracker);
    Trackers.push(currentTracker);
    await game.settings.set(moduleName, 'internal-trackers', Trackers);
    console.info(`${moduleTag} | Tracking Ammo with id ${currentTracker.id}.`);
});


Hooks.on('deleteCombat', async (combat) => {
    const currentTracker = Trackers.find(elem => elem.id == combat.data._id)
    currentTracker.endTracking();
    Trackers = Trackers.filter(elem => elem.id != combat.id);
    game.settings.set(moduleName, 'internal-trackers', Trackers);
    console.log(`${moduleTag} | Tracking Ended.`);
});


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
