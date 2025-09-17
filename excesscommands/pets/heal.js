const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile } = require('../../models/economy');
const Pet = require('../../models/pets/pets');

module.exports = {
    name: 'heal',
    description: 'Heal your pet to restore its HP.',
    async execute(message, args) {
        const userId = message.author.id;
        const petName = args[0];

        if (!petName) {
            return message.reply('Please specify which pet you want to heal.');
        }

        const profile = await getEconomyProfile(userId);
        const pet = await Pet.findOne({ ownerId: userId, name: petName });

        if (!pet) {
            return message.reply(`You don\'t own a pet named ${petName}.`);
        }

        const medicineItem = profile.inventory.find(item => item.id === 'pet_medicine');

        if (!medicineItem) {
            return message.reply('You don\'t have any pet medicine. You can buy some from the shop.');
        }

        // Consume one pet medicine
        const itemIndex = profile.inventory.findIndex(item => item.id === 'pet_medicine');
        profile.inventory.splice(itemIndex, 1);
        await profile.save();

        // Increase pet\'s HP
        pet.stats.hp = Math.min(100, pet.stats.hp + 25);
        await pet.save();

        const embed = new EmbedBuilder()
            .setTitle(`${pet.name} has been healed!`)
            .setDescription(`${pet.name}\'s HP is now ${pet.stats.hp}/100.`)
            .setColor('#00FF00');

        message.reply({ embeds: [embed] });
    },
};
