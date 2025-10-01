const { Schema, model } = require('mongoose');

const kingdomConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
});

module.exports = model('KingdomConfig', kingdomConfigSchema);