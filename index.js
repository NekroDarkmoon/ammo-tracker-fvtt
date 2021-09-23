// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag, messageDelete } from "./scripts/constants.js";
import { registerSettings } from "./scripts/settings.js";
import {AmmoTracker} from "./scripts/tracker.js"

export let socket;
let trackers = [];

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
    console.log(`${moduleTag} | Ready`);
    watcher();
});


Hooks.on('createCombat', async (...args) => {
    const tracker = new AmmoTracker(args[0].data._id);
    trackers.push(tracker);
});


Hooks.on('updateCombat', async (...args) => {
    if (args[0].data.round === 0) { return true; }
    
    for (let tracker of trackers) {
        if (tracker.combatId == args[0].data._id){
            if (!tracker.started) {
                tracker.started = true;
                await tracker.startTracker();
            }
            break;
        }
    }
}); 


Hooks.on('deleteCombat', async (...args) => {
    for (let tracker of trackers) {
        if (tracker.combatId == args[0].data._id) {
            if (tracker.started) {
                tracker.ended = true;
                await tracker.endTracker();
            }
        }
    }
});


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Watcher
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function watcher() {
    $(document).on('click', '.at-recover-btn', async (button) => {
        if (!game.user.isGM) {
            
        }

        let currentTracker = trackers.find(tracker => tracker.combatId == button.currentTarget.dataset.combatId );
        console.log(currentTracker);
        
        if (currentTracker != undefined){
            let dataset = button.currentTarget.dataset; 
            await currentTracker.recover(dataset.actorId);
        }

    });
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Tracker
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Tracker
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
