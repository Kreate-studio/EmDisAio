const { EmbedBuilder } = require('discord.js');
const Event = require('../../models/pets/events');

module.exports = {
    name: 'event',
    description: 'View the current world boss event.',
    async execute(message) {
        const event = await Event.findOne({ type: 'world_boss', startAt: { $lte: new Date() }, endAt: { $gte: new Date() } });

        if (!event) {
            return message.reply('There is no active world boss event right now.');
        }

        const embed = new EmbedBuilder()
            .setTitle(`World Boss Event: ${event.name}`)
            .setDescription(`The world boss has ${event.bossHp} HP remaining!`)
            .addFields(
                { name: 'Starts', value: event.startAt.toDateString(), inline: true },
                { name: 'Ends', value: event.endAt.toDateString(), inline: true },
            )
            .setColor('#8B0000');

        message.reply({ embeds: [embed] });
    },
};
