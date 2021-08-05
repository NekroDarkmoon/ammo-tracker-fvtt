// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag, messageDelete } from "./scripts/constants.js";
import { registerSettings } from "./scripts/settings.js";
import {Tracker} from "./scripts/tracker.js"

let Trackers = null;
export let socket;

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                              Main
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Hooks.on('init', async () => {
    await registerSettings();
    console.log(`${moduleTag} | Initialized`);
});


Hooks.on('socketlib.ready', () => {
    socket = socketlib.registerModule(moduleName);
    socket.register("messageDelete", messageDelete);
});


Hooks.on('ready', async () => {    
    let prevTrackers = game.settings.get(moduleName, 'internal-trackers');
    Trackers = [];
    
    // Remove any trackers from Settings that are no longer running.
    let currentCombats = game.combats._source.map(elem => elem._id);
    let temp = [];
    temp = temp.concat(prevTrackers.filter(tracker => {     
        return currentCombats.indexOf(tracker.id) >= 0;    
    }));
    
    if (game.user.isGM) {
        console.log(temp);
        game.settings.set(moduleName, 'internal-trackers', temp);
    }

    // Re-init
    for (let index = 0; index < temp.length; index++) {
        const currentTracker = new Tracker(null, temp[index]);
        Trackers.push(currentTracker);
    }
    

    watcher();
    console.log(`${moduleTag} | Ready`);

});


Hooks.on('createCombat', async (combat) => {
    if (game.user.isGM) {
        const currentTracker = new Tracker(combat.data._id);
        currentTracker.startTracking();
        Trackers.push(currentTracker);
        await game.settings.set(moduleName, 'internal-trackers', Trackers);
        console.info(`${moduleTag} | Tracking Ammo with id ${currentTracker.id}.`);
    } else {
        console.info(`${moduleTag} | Tracking Ammo with id ${combat.data._id}.`);
    }
});


Hooks.on('deleteCombat', async (combat) => {
    if (game.user.isGM) {
        const currentTracker = Trackers.find(elem => elem.id == combat.data._id);
        await currentTracker.endTracking();
        await game.settings.set(moduleName, "internal-trackers", Trackers);
        console.log(`${moduleTag} | Tracking Ended.`);
    } else {
        console.log(`${moduleTag} | Tracking Ended.`);
    }
});


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Watcher
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function watcher() {
    $(document).on('click', '.at-recover-btn', async (button) => {

        if(!game.user.isGM) {
            let temp = game.settings.get(moduleName, 'internal-trackers');
            Trackers = [];

            for (let index = 0; index < temp.length; index++) {
                const currentTracker = new Tracker(null, temp[index]);
                Trackers.push(currentTracker);
            }
        }

        let currentTracker = Trackers.find(tracker => tracker.id == button.currentTarget.dataset.combatId );
        console.log(currentTracker);

        if (currentTracker != undefined){
            await currentTracker.recover(button.currentTarget.dataset.actorId);
        }
    });
}

