const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');

module.exports = {
    name: 'rest',
    description: 'Let your pet rest to restore its energy.',
    async execute(message, args) {
        const userId = message.author.id;
        const petName = args[0];

        if (!petName) {
            return message.reply('Please specify which pet you want to let rest.');
        }

        const pet = await Pet.findOne({ ownerId: userId, name: petName });

        if (!pet) {
            return message.reply(`You don\'t own a pet named ${petName}.`);
        }

        // Increase pet\'s energy
        pet.stats.energy = Math.min(100, pet.stats.energy + 50);
        await pet.save();

        const embed = new EmbedBuilder()
            .setTitle(`${pet.name} is resting!`)
            .setDescription(`${pet.name}\'s energy is now ${pet.stats.energy}/100.`)
            .setColor('#00FF00');

        message.reply({ embeds: [embed] });
    },
};
