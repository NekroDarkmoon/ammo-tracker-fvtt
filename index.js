// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag, messageDelete } from "./scripts/constants.js";
import { registerSettings } from "./scripts/settings.js";
import {Tracker} from "./scripts/tracker.js"

// export let socket;

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                              Main
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Hooks.on('init', async () => {
    await registerSettings();
    console.log(`${moduleTag} | Initialized`);
});


Hooks.on('socketlib.ready', () => {
    // socket = socketlib.registerModule(moduleName);
    // socket.register("messageDelete", messageDelete);
});


Hooks.on('ready', async () => {    
   console.log(`${moduleTag} | Ready`);

});

