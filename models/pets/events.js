const { Schema, model } = require('mongoose');

const eventSchema = new Schema({
  eventId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  bossHp: { type: Number },
  participants: { type: Map, of: { damage: Number } },
  rewards: {
    top10: { type: String },
    all: { type: String },
  },
});

module.exports = model('Event', eventSchema);
