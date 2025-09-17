const { EmbedBuilder } = require('discord.js');
const { Event } = require('../../models/pets/events');
const { Pet } = require('../../models/pets/pets');

module.exports = {
    name: 'event-attack',
    description: 'Attack the world boss in the current event.',
    async execute(message) {
        const userId = message.author.id;
        const event = await Event.findOne({ type: 'world_boss', startAt: { $lte: new Date() }, endAt: { $gte: new Date() } });

        if (!event) {
            return message.reply('There is no active world boss to attack.');
        }

        const participant = event.participants.find(p => p.userId === userId);

        if (!participant) {
            return message.reply('You need to join the event first with `/event-join`.');
        }

        const userPets = await Pet.find({ ownerId: userId });

        if (userPets.length === 0) {
            return message.reply('You need a pet to participate in the event.');
        }

        // For simplicity, we'll use the user's strongest pet
        const pet = userPets.sort((a, b) => b.stats.attack - a.stats.attack)[0];

        const damage = Math.floor(pet.stats.attack * (Math.random() * (1.2 - 0.8) + 0.8));

        event.bossHp -= damage;
        participant.damage += damage;

        await event.save();

        const embed = new EmbedBuilder()
            .setTitle(`${pet.name} attacks the world boss!`)
            .setDescription(`You dealt ${damage} damage to ${event.name}.`)
            .addFields(
                { name: 'Your Total Damage', value: participant.damage.toString(), inline: true },
                { name: 'Boss HP Remaining', value: event.bossHp.toString(), inline: true },
            )
            .setColor('#FF4500');

        message.reply({ embeds: [embed] });
    },
};
