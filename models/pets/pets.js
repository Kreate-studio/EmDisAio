const { Schema, model } = require('mongoose');

const petSchema = new Schema({
  petId: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  species: { type: String, required: true },
  rarity: { type: String, required: true },
  image: { type: String },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  ageHours: { type: Number, default: 0 },
  stats: {
    hp: { type: Number, default: 100 },
    maxHealth: { type: Number, default: 100 }, // Added maxHealth
    attack: { type: Number, default: 10 },
    defense: { type: Number, default: 10 },
    speed: { type: Number, default: 10 },
    hunger: { type: Number, default: 100 },
    happiness: { type: Number, default: 100 },
    energy: { type: Number, default: 100 },
  },
  abilities: [Object],
  specialAbilities: [Object],
  battleRecord: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
  },
  lastDecay: { type: Date, default: Date.now },
  isDead: { type: Boolean, default: false },
  evolutionStage: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

const Pet = model('Pet', petSchema);

async function getPet(userId) {
    return Pet.find({ ownerId: userId });
}

module.exports = { Pet, getPet };