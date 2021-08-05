export const moduleName = "ammo-tracker-fvtt";
export const moduleTag = "Ammo Tracker";

export const messageDelete = function (messageId) {
    game.messages.get(messageId).delete();
}