// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag } from './constants.js';

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                          Ammo Tracker
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export class AmmoTracker {
	constructor(combatId, resumed = false) {
		this.combatId = combatId;
		this.started = false;
		this.ended = false;

		this.combat = game.combats.get(combatId);
		if (resumed) {
			this.actorIds = this.fetchActorIds(this.combat);
		} else {
			this.actorIds = null;
		}
	}

	/**
	 * Starts the tracking of ammuniton on all player characters
	 */
	async startTracker() {
		let currCombat = game.combats.get(this.combatId);
		this.actorIds = this.fetchActorIds(currCombat);
		const actors = this.fetchActors();

		// Get projectile data for all actors
		const projectileData = await this.getProjectilesData(actors);
		await currCombat.setFlag(moduleName, 'projectileData', projectileData);
	}

	/**
	 * Ends Ammuniton tracking for a given tracker.
	 */
	async endTracker() {
		// Get used ammor for each actor
		const actors = this.fetchActors();
		const sentMsgs = {};
		for (let actor of actors) {
			const usedAmmo = this.usedAmmo(actor);
			// Skip if no ammo consumed
			if (usedAmmo.length == 0) {
				continue;
			}

			sentMsgs[actor.data._id] = await this.toMessage(actor, usedAmmo);
		}

		// Set setting for deletion
		await game.settings.set(moduleName, 'chat-trackers', sentMsgs);
	}

	/**
	 *
	 * @param {*} actors
	 * @returns
	 */
	async getProjectilesData(actors) {
		// Use actor ids as keys
		const projectileData = {};

		for (let actor of actors) {
			let projectiles = this.fetchProjectileItems(actor);

			// Use item ids as keys
			const data = {};
			for (let item of projectiles) {
				data[item._id] = item.data.quantity;
			}

			// Add item flag to actor
			// actor.setFlag(moduleName, 'projectileData', data);
			projectileData[actor.data._id] = data;
		}
		return projectileData;
	}

	/**
	 *
	 * @param {*} actor
	 * @returns
	 */
	usedAmmo(actor) {
		const projectileItems = this.fetchProjectileItems(actor);
		const projectileData = this.combat.getFlag(moduleName, 'projectileData');

		let data = [];

		for (let item of projectileItems) {
			const startAmt = projectileData[actor.data._id][item._id];
			const endAmt = item.data.quantity;

			if (endAmt !== startAmt) {
				const ammoData = this.calc(startAmt, endAmt);
				data.push({ item, ammoData });
			}
		}

		return data;
	}

	/**
	 *
	 * @param {*} actorId
	 */
	async recover(actorId) {
		// Vars
		let actor = game.actors.get(actorId);
		const data = this.usedAmmo(actor);
		let message = '';
		let updates = [];
		const messageId = game.settings.get(moduleName, 'chat-trackers')[actorId];

		// Send new message to group
		for (let elem of data) {
			const ammoData = elem.ammoData;
			const item = elem.item;
			const newCount = ammoData.endAmt + ammoData.recoverable;
			updates.push({ _id: item._id, 'data.quantity': newCount });

			message += `${elem.item.name}: ${ammoData.startAmt} ➔ ${ammoData.endAmt}`;
			message += `<br><b>Consumed:</b> ${ammoData.consumed}`;
			message += `<br><b>Recovered:</b> ${ammoData.recoverable}<hr>`;
		}

		actor.updateEmbeddedDocuments('Item', updates);
		console.info(`${moduleTag} | Updated item counts.`);

		let button = `<button data-actor-id="${actor.data._id}"
                        class="at-recovered-btn disabled">Recovered!</button>`;

		await ChatMessage.create({
			content: [message, button].join(''),
			speaker: { alias: `${actor.data.name}` },
		});

		// Delete previous message.
		try {
			await game.messages.get(messageId).delete();
		} catch (error) {
			console.error(`Unable to find message with id ${messageId}`);
		}
	}

	/**
	 *
	 * @param {number} startAmt
	 * @param {number} endAmt
	 * @returns {Object}
	 */
	calc(startAmt, endAmt) {
		const PERCENT = 50;

		const consumed = startAmt - endAmt;
		const recoverable = Math.floor(consumed * (PERCENT * 0.01));

		// return {consumed: consumed, endAmt: endAmt, startAmt: startAmt, recoverable: recoverable};
		return { consumed, endAmt, startAmt, recoverable };
	}

	/**
	 *
	 * @param {*} combat
	 * @returns
	 */
	fetchActorIds(combat) {
		return combat.data.combatants._source.map(actor => actor.actorId);
	}

	/**
	 *
	 * @returns
	 */
	fetchActors() {
		let actors = this.actorIds.map(actorId => game.actors.get(actorId));
		return actors.filter(actor => actor.data.type == 'character');
	}

	/**
	 *
	 * @param {*} actor
	 * @returns
	 */
	fetchProjectileItems(actor) {
		return actor.data.items._source.filter(
			item => item.data.consumableType == 'ammo'
		);
	}

	/**
	 *
	 * @param {*} actor
	 * @param {*} data
	 * @returns
	 */
	async toMessage(actor, data) {
		// Send to chat
		let message = '';
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
			speaker: { alias: `${actor.data.name}` },
			whisper: ChatMessage.getWhisperRecipients(actor.data.name),
		});

		return chat.data._id;
	}
}
