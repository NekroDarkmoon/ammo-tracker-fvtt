// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag } from "./scripts/constants.js";
import { registerSettings } from "./scripts/settings.js";
import {Tracker} from "./scripts/tracker.js"

let Trackers = null;

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                              Main
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Hooks.on('init', async () => {
    await registerSettings();
    console.log(`${moduleTag} | Initialized`);
});


Hooks.on('ready', async () => {    
    let temp = game.settings.get(moduleName, 'internal-trackers');
    Trackers = [];
    console.log(temp);
    
    for (let index = 0; index < temp.length; index++) {
        const currentTracker = new Tracker(null, temp[index]);
        Trackers.push(currentTracker);
    }
    
    watcher();
    console.log(`${moduleTag} | Ready`);

});


Hooks.on('createCombat', async (combat) => {
    const currentTracker = new Tracker(combat.data._id);
    currentTracker.startTracking();
    Trackers.push(currentTracker);
    await game.settings.set(moduleName, 'internal-trackers', Trackers);
    console.info(`${moduleTag} | Tracking Ammo with id ${currentTracker.id}.`);
});


Hooks.on('deleteCombat', async (combat) => {
    const currentTracker = Trackers.find(elem => elem.id == combat.data._id);
    currentTracker.endTracking();
    const temp = Trackers.filter(elem => elem.id != combat.id);
    game.settings.set(moduleName, 'internal-trackers', temp);
    console.log(`${moduleTag} | Tracking Ended.`);
});


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Watcher
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function watcher() {
    $(document).on('click', '.at-recover-btn', async (button) => {
        let currentTracker = Trackers.find(tracker => tracker.id == button.currentTarget.dataset.combatId );
        if (currentTracker != undefined){
            await currentTracker.recover(button.currentTarget.dataset.actorId);
        }
    });
}
