const { EmbedBuilder } = require('discord.js');
const { getPet } = require('../../models/pets/pets');
const { rarityColors } = require('../../utils/rarityColors');

module.exports = {
    name: 'flex',
    description: 'Display your highest quality and level pet.',

    async execute(message, args) {
        const userId = message.author.id;
        const pets = await getPet(userId);

        if (!pets || pets.length === 0) {
            return message.reply('You do not have any pets to show off yet!');
        }

        // Sort by rarity and then by level
        const sortedPets = pets.sort((a, b) => {
            const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Exclusive'];
            const rarityA = rarityOrder.indexOf(a.rarity);
            const rarityB = rarityOrder.indexOf(b.rarity);

            if (rarityA !== rarityB) {
                return rarityB - rarityA;
            }
            return b.level - a.level;
        });

        const pet = sortedPets[0];
        const rarityColor = rarityColors[pet.rarity] || '#FFFFFF';

        const embed = new EmbedBuilder()
            .setTitle(`${pet.name} - Level ${pet.level}`)
            .setColor(rarityColor)
            .setThumbnail(pet.image)
            .addFields(
                { name: 'Rarity', value: pet.rarity, inline: true },
                { name: 'Attack', value: `${pet.stats.attack}`.toString(), inline: true },
                { name: 'Defense', value: `${pet.stats.defense}`.toString(), inline: true },
                { name: 'Speed', value: `${pet.stats.speed}`.toString(), inline: true },
                { name: 'Status', value: pet.status, inline: true }
            )
            .setFooter({ text: `Owned by ${message.author.username}` });

        message.reply({ embeds: [embed] });
    },
};