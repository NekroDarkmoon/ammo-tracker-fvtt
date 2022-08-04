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
		if (resumed) this.actorIds = this.fetchActorIds(this.combat);
		else this.actorIds = null;
	}

	/**
	 * Starts the tracking of ammunition on all PCs
	 */
	async startTracker() {
		const currCombat = game.combats.get(this.combatId);
		this.actorIds = this.fetchActorIds(currCombat);
		const actors = this.fetchActors();

		// Get projectile data for all actors
		const projectileData = await this.getProjectileData(actors);
		await currCombat.setFlag(moduleName, 'projectileData', projectileData);
	}

	/**
	 * Ends Ammunition tracking for a given tracker.
	 */
	async endTracker() {
		// Get used ammo for each actor
		const actors = this.fetchActors();
		const sentMsgs = {};
		for (const actor of actors) {
			const usedAmmo = this.usedAmmo(actor);
			// Skip if no ammo consumed
			if (usedAmmo.length == 0) continue;

			sentMsgs[actor._id] = await this.toMessage(actor, usedAmmo);
		}

		// Set setting for deletion
		await game.settings.set(moduleName, 'chat-trackers', sentMsgs);
	}

	/**
	 *
	 * @param {*} combatuuu
	 * @returns
	 */
	fetchActorIds(combat) {
		return combat.combatants.map(a => a.actorId);
	}

	fetchActors() {
		const actors = this.actorIds.map(id => game.actors.get(id));
		return actors.filter(a => a.type === 'character');
	}

	/**
	 *
	 * @param {*} actor
	 * @param {*} data
	 * @returns
	 */
	async toMessage(actor, data) {
		// Send to chat
		let msg = '';
		for (const elem of data) {
			const ammoData = elem.ammoData;
			msg += `${elem.item.name}: ${ammoData.startAmt} ➔ ${ammoData.endAmt}`;
			msg += `<br><b>Consumed:</b> ${ammoData.consumed}`;
			msg += `<br><b>Recoverable:</b> ${ammoData.recoverable}<hr>`;
		}

		const button = `<button data-actor-id="${actor._id}" 
                        data-combat-id="${this.combatId}"
                        class="at-recover-btn">Recover Items</button>`;

		const chat = await ChatMessage.create({
			content: [msg, button].join(''),
			speaker: { alias: `${actor.name}` },
			whisper: ChatMessage.getWhisperRecipients(actor.name),
		});

		return chat._id;
	}

	async recoverMsg(actorId) {}

	// ***************************************
	// Overrides
	// ***************************************
	/**
	 *
	 * @param {*} actors
	 * @returns
	 */
	async getProjectileData(actors) {}

	usedAmmo(actor) {}

	async recover(actorId) {}
}
