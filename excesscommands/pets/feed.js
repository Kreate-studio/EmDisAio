const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile, removeFromInventory } = require('../../models/economy');
const { Pet } = require('../../models/pets/pets');

module.exports = {
    name: 'feed',
    description: 'Feed your pet to restore its hunger.',
    async execute(message, args) {
        const userId = message.author.id;
        const petName = args.join(' ');

        if (!petName) {
            return message.reply('Please specify which pet you want to feed.');
        }

        const profile = await getEconomyProfile(userId);
        const pet = await Pet.findOne({ ownerId: userId, name: petName });

        if (!pet) {
            return message.reply(`You don\'t own a pet named ${petName}.`);
        }

        const foodItem = profile.inventory.find(item => item.id === 'pet_food');

        if (!foodItem) {
            return message.reply('You don\'t have any pet food. You can buy some from the shop.');
        }

        // Consume one pet food
        await removeFromInventory(userId, foodItem.uniqueId);

        // Increase pet\'s hunger
        pet.stats.hunger = Math.min(100, pet.stats.hunger + 30);
        await pet.save();

        const embed = new EmbedBuilder()
            .setTitle(`${pet.name} has been fed!`)
            .setDescription(`${pet.name}\'s hunger is now ${pet.stats.hunger}/100.`)
            .setColor('#00FF00');

        message.reply({ embeds: [embed] });
    },
};
