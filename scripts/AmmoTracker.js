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
}
