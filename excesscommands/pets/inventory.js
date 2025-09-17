const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');

module.exports = {
    name: 'inventory',
    description: "Displays your collection of pets.",
    aliases: ['inv'],

    async execute(message, args) {
        const userId = message.author.id;
        const userPets = await Pet.find({ ownerId: userId });

        if (userPets.length === 0) {
            return message.reply("You don\'t own any pets yet! Visit the `petshop` to buy one or use `$pet buy egg` to get started.");
        }

        const embed = new EmbedBuilder()
            .setTitle(`🐾 ${message.author.username}\'s Pet Collection`)
            .setColor('#4CAF50');

        for (const pet of userPets) {
            const status = pet.isDead ? '💀 Dead' : '💖 Alive';
            embed.addFields({
                name: `${pet.name} (${pet.species})`,
                value: `**Rarity:** ${pet.rarity}\n**Level:** ${pet.level}\n**Status:** ${status}`
            });
        }

        return message.reply({ embeds: [embed] });
    }
};
