// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag, messageDelete } from "./constants.js";
import {socket} from "../index.js";


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                          Ammo Tracker
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export class AmmoTracker {

    constructor(combatId) {
        this.combatId = combatId;
        this.started = false;
        this.ended = false;

        this.actorIds = null;
        this.combat = game.combats.get(combatId);
    }

    async startTracker() {
        let currCombat = game.combats.get(this.combatId);
        this.actorIds = this.fetchActorIds(currCombat);
        const actors = this.fetchActors();
        
        // Get projectile data for all actors
        const projectileData = await this.getProjectilesData(actors);
        await currCombat.setFlag(moduleName, 'projectileData', projectileData);

    }


    async endTracker() {
        // Get used ammor for each actor
        const actors = this.fetchActors();
        const sentMsgs = {};
        for (let actor of actors) {
            const usedAmmo = this.usedAmmo(actor);
            // Skip if no ammo consumed

            sentMsgs[actor.data._id] = await this.toMessage(actor, usedAmmo);
        }

        // Set setting for deletion
        await game.settings.set(moduleName, 'chat-trackers', sentMsgs);

    }


    async getProjectilesData(actors) {
        // Use actor ids as keys
        const projectileData = {}

        for (let actor of actors) {
            let projectiles = this.fetchProjectileItems(actor);
            
            // Use item ids as keys
            const data = {};
            for (let item of projectiles) {
                data[item._id] = item.data.quantity;
            }

            // Add item flag to actor
            actor.setFlag(moduleName, 'projectileData', data);
            projectileData[actor.data._id] = data;
        }
        return projectileData;
    }


    usedAmmo(actor) {
        const projectileItems = this.fetchProjectileItems(actor);
        const projectileData = this.combat.getFlag(moduleName, 'projectileData');

        let data = [];

        for (let item of projectileItems) {
            const startAmt = (projectileData[actor.data._id])[item._id];
            const endAmt = item.data.quantity;

            if (endAmt !== startAmt) {
                const ammoData = this.calc(startAmt, endAmt);
                data.push( {item, ammoData} );
            }
        }

        return data;
    }


    async recover(actorId) {
        // Vars
        let actor = game.actors.get(actorId);
        const data = this.usedAmmo(actor);
        let message = "";
        let updates = [];
        console.log(game.settings.get(moduleName, 'chat-trackers'));
        const messageId = game.settings.get(
            moduleName, 'chat-trackers')[actorId];
                
        // Delete previous message.
        await game.messages.get(messageId).delete();

        // Send new message to group
        for (let elem of data) {
            const ammoData = elem.ammoData;
            const item = elem.item;
            const newCount = ammoData.endAmt + ammoData.recoverable;
            updates.push( {_id: item._id, "data.quantity": newCount} );
            
            message += `${elem.item.name}: ${ammoData.startAmt} ➔ ${ammoData.endAmt}`;
            message += `<br><b>Consumed:</b> ${ammoData.consumed}`;
            message += `<br><b>Recovered:</b> ${ammoData.recoverable}<hr>`;
        }

        actor.updateEmbeddedDocuments("Item", updates);
        console.info(`${moduleTag} | Updated item counts.`);
        
        let button = `<button data-actor-id="${actor.data._id}"
                        class="at-recovered-btn disabled">Recovered!</button>`; 
        
        await ChatMessage.create({
            content: [message, button].join(''),
            speaker: ({alias: `${actor.data.name}`}), 
        });
    }


    calc(startAmt, endAmt) {
        const PERCENT = 50;

        const consumed = startAmt - endAmt;
        const recoverable = Math.ceil(consumed * (PERCENT * 0.01));

        // return {consumed: consumed, endAmt: endAmt, startAmt: startAmt, recoverable: recoverable};
        return { consumed, endAmt, startAmt, recoverable};
    }

    fetchActorIds(combat) {
        return combat.data.combatants._source.map(actor => actor.actorId);
    }

    fetchActors() {
        return this.actorIds.map(actorId => game.actors.get(actorId));
    }

    fetchProjectileItems(actor) {
        return actor.data.items._source.filter(item => item.data.consumableType == 'ammo');
    }

    async toMessage(actor, data) {
        // Send to chat
        let message = "";
        for (let elem of data) {
            const ammoData = elem.ammoData;
            message += `${elem.item.name}: ${ammoData.startAmt} ➔ ${ammoData.endAmt}`;
            message += `<br><b>Consumed:</b> ${ammoData.consumed}`;
            message += `<br><b>Recoverable:</b> ${ammoData.recoverable}<hr>`;
        }

        let button = `<button data-actor-id="${actor.data._id}" 
                        data-combat-id="${this.combatId}"
                        class="at-recover-btn">Recover Items</button>`;

        let chat = await ChatMessage.create({
            content: [message, button].join(''),
            speaker: ({alias: `${actor.data.name}`}), 
            whisper: ChatMessage.getWhisperRecipients(actor.data.name)
        });


        return chat.data._id;

    }

}


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Tracker
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Tracker
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Tracker
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
