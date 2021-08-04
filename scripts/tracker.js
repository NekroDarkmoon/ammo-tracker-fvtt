// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag } from "./constants.js";


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Person
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
class Person {
    constructor(actor, id, existing = {}) {

        if (Object.keys(existing).length != 0){

            existing.actor = game.actors.get(existing.actor._id);
            existing.projectileItems = existing.actor.data.items._source.filter(item => item.data.consumableType == 'ammo');
            Object.assign(this, existing);

        } else {
            this.id = id;
            this.actor = actor.data;
            this.projectileItems = actor.data.items._source.filter(item => item.data.consumableType == 'ammo');
            this.ammoTrackers = {}; 
            this.consumed = null;
            this.message = null;
        }
        
    }

    async startTracking() {
        // Get Ammo Counts
        for (let item of this.projectileItems) {
            this.ammoTrackers[item._id] = item.data.quantity;
        }
    }


    async endTracking() {
        // Calculate used ammo
        let data = [];

        for (let item of this.projectileItems) {
            let consumed = this.ammoTrackers[item._id] - item.data.quantity;
            if (consumed > 0) {
                let canRecover = this.recovery(consumed);
                data.push({
                    id: item._id,
                    name: item.name,
                    original: this.ammoTrackers[item._id],
                    consumed: consumed,
                    recoverable: canRecover
                });
            }
        }

        // Send to Chat
        if (data.length > 0) {await this.toMessage(data);}
        this.consumed = data; 
    }

    recovery(consumed) {
        // Calculate Recovable ammo and display
        const PERCENT = 50;
        return Math.ceil(consumed * (PERCENT * 0.01));
    }


    async recover() {
        let updates = [];
        for (let index = 0; index < this.projectileItems.length; index++) {
            const item = this.projectileItems[index];
            const data = this.consumed.find(elem => elem.id == item._id);
            if (data != undefined || data != null) {
                let newCount = (data.original - data.consumed) + data.recoverable;
                updates.push({_id : data.id, "data.quantity" : newCount});
            }
        }

        console.info(`${moduleTag} | Updated item counts.`);
        let button = `<button data-actor-id="${this.actor._id}"
                        class="at-recovered-btn disabled">Recovered!</button>`
        this.message[0].delete();
        
        await ChatMessage.create({
            content: [this.message[1], button].join(''),
            speaker: ({alias: `${this.actor.name}`})
        });
    } 


    async toMessage(data){
        // Send to chat
        let message = "";
        for (let item of data){
            message += `${item.name}: ${item.original} --> ${item.original - item.consumed}`;
            message += `<br><b>Consumed:</b> ${item.consumed}`;
            message += `<br><b>Recoverable:</b> ${item.recoverable}<hr>`;
        }

        let button = `<button data-actor-id="${this.actor._id}" 
                        data-combat-id="${this.id}" 
                        class="at-recover-btn">Recover Items</button>`;

        let chat = await ChatMessage.create({
            content: [message, button].join(''),
            speaker: ({alias: `${this.actor.name}`}), 
        });
        
        this.message = [chat, message];
    }

}


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Tracker
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export class Tracker {

    constructor(id, existing={}) {
        if (Object.keys(existing).length != 0) {
            for (let index = 0; index < existing.trackers.length; index++) {
                const person = existing.trackers[index];
                existing.trackers[index] = new Person(null, null, person);
            }

            Object.assign(this, existing);

        } else {
            this.id = id;
            this.actors = game.users.players.map(({data: {character}}) => game.actors.get(character));
            this.trackers = this.actors.map(actor => new Person(actor, id));
        }
    }

    async startTracking() {
        return Promise.all(this.trackers.map(tracker => tracker.startTracking()));
    }


    async endTracking() {
        return Promise.all(this.trackers.map(tracker => tracker.endTracking()));
    }

    async recover(actorId) {
        await this.trackers.find(({actor: {_id}}) => _id == actorId).recover();
    }

}
