const Event = require('../../models/pets/events');

module.exports = {
    name: 'event-join',
    description: 'Join the current world boss event.',
    async execute(message) {
        const userId = message.author.id;
        const event = await Event.findOne({ type: 'world_boss', startAt: { $lte: new Date() }, endAt: { $gte: new Date() } });

        if (!event) {
            return message.reply('There is no active world boss event to join.');
        }

        if (event.participants.some(p => p.userId === userId)) {
            return message.reply('You have already joined this event.');
        }

        event.participants.push({ userId, damage: 0 });
        await event.save();

        message.reply('You have joined the world boss event! Use the `/event-attack` command to deal damage.');
    },
};
