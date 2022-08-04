// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                            Imports
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { AmmoTracker } from '../AmmoTracker.js';
import { moduleName, moduleTag } from '../constants.js';

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                          Tracker
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export class Dnd5eTracker extends AmmoTracker {
	constructor(combatId, resumed = false) {
		super(combatId, resumed);
	}

	// ***************************
	// Overrides
	// ***************************
	/**
	 *
	 * @param {*} actors
	 */
	async getProjectileData(actors) {
		// Use actor ids as keys
		const projectileData = {};

		for (const actor of actors) {
			const projectiles = this.fetchProjectileItems(actor);

			// Use item ids as keys
			const data = {};
			for (const item of projectiles) {
				data[item._id] = item.quantity;
			}

			projectileData[actor._id] = data;
		}

		return projectileData;
	}

	usedAmmo(actor) {
		const projectileItems = this.fetchProjectileItems(actor);
		const projectileData = this.combat.getFlag(moduleName, 'projectileData');

		const data = [];
		for (const item of projectileItems) {
			const startAmt = projectileData[actor._id][item._id];
			const endAmt = item.quantity;

			if (endAmt !== startAmt) {
				const ammoData = this.calc(startAmt, endAmt);
				data.push({ item, ammoData });
			}
		}

		return data;
	}

	async recover(actorId) {
		const actor = game.actors.get(actorId);
		const data = this.usedAmmo(actor);
		let msg = '';
		const updates = [];
		const messageId = game.settings.get(moduleName, 'chat-trackers')[actorId];

		// Generate message data
		for (const elem of data) {
			const ammoData = elem.ammoData;
			const item = elem.item;
			const newCount = ammoData.endAmt + ammoData.recoverable;
			updates.push({ _id: item._id, quantity: newCount });

			msg += `${elem.item.name}: ${ammoData.startAmt} ➔ ${ammoData.endAmt}`;
			msg += `<br><b>Consumed:</b> ${ammoData.consumed}`;
			msg += `<br><b>Recovered:</b> ${ammoData.recoverable}<hr>`;
		}

		actor.updateEmbeddedDocuments('Item', updates);
		console.info(`${moduleTag} | Updated item counts.`);

		let button = `<button data-actor-id="${actor._id}"
                        class="at-recovered-btn disabled">Recovered!</button>`;

		await ChatMessage.create({
			content: [msg, button].join(''),
			speaker: { alias: `${actor.name}` },
		});

		// Delete previous message.
		try {
			await game.messages.get(messageId).delete();
		} catch (error) {
			console.error(`Unable to find message with id ${messageId}`);
		}
	}

	// ***************************
	// Helpers
	// ***************************
	fetchProjectileItems(actor) {
		return actor.items.filter(i => i.consumableType === 'ammo');
	}

	calc(startAmt, endAmt) {
		const PERCENT = 50;
		const consumed = startAmt - endAmt;
		const recoverable = Math.floor(consumed * PERCENT * 0.01);

		return { consumed, endAmt, startAmt, recoverable };
	}
}
