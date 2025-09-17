const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile } = require('../../models/economy');
const Pet = require('../../models/pets/pets');

module.exports = {
    name: 'play',
    description: 'Play with your pet to increase its happiness.',
    async execute(message, args) {
        const userId = message.author.id;
        const petName = args[0];

        if (!petName) {
            return message.reply('Please specify which pet you want to play with.');
        }

        const profile = await getEconomyProfile(userId);
        const pet = await Pet.findOne({ ownerId: userId, name: petName });

        if (!pet) {
            return message.reply(`You don\'t own a pet named ${petName}.`);
        }

        const toyItem = profile.inventory.find(item => item.id === 'pet_toy');

        if (!toyItem) {
            return message.reply('You don\'t have any pet toys. You can buy some from the shop.');
        }

        // Consume one pet toy
        const itemIndex = profile.inventory.findIndex(item => item.id === 'pet_toy');
        profile.inventory.splice(itemIndex, 1);
        await profile.save();

        // Increase pet\'s happiness
        pet.stats.happiness = Math.min(100, pet.stats.happiness + 20);
        await pet.save();

        const embed = new EmbedBuilder()
            .setTitle(`You played with ${pet.name}!`)
            .setDescription(`${pet.name}\'s happiness is now ${pet.stats.happiness}/100.`)
            .setColor('#00FF00');

        message.reply({ embeds: [embed] });
    },
};
