const { EmbedBuilder } = require('discord.js');
const allItems = require('../../data/petShopItems');
const allPets = require('../../data/pets');

const allPossibleItems = [...Object.values(allItems).flat(), ...allPets];

module.exports = {
    name: 'petlist',
    description: 'List all available pets and items in the shop.',
    aliases: ['pl'],
    async execute(message, args) {
        const itemsByCategory = {
            "Pets": [],
            "Pet Eggs": [],
            "Pet Supplies": [],
            "Exclusive Pets": [],
        };

        allPossibleItems.forEach(item => {
            if (itemsByCategory[item.category]) {
                itemsByCategory[item.category].push(item);
            }
        });

        const embed = new EmbedBuilder()
            .setTitle('🐾 Pet Shop List 🐾')
            .setColor('#4CAF50');

        for (const category in itemsByCategory) {
            if (itemsByCategory[category].length > 0) {
                const items = itemsByCategory[category].map(item => {
                    const priceString = item.rarity === 'Exclusive'
                        ? 'Exclusive (Admin Give Only)'
                        : item.price === null
                            ? 'Not for sale'
                            : item.currency === 'gold'
                                ? `${item.price} gold`
                                : `$${item.price.toLocaleString()}`;
                    return `**${item.name}** - ${priceString}\n*${item.description}*`;
                }).join('\n\n');
                embed.addFields({ name: `\n${category}`, value: items });
            }
        }

        message.reply({ embeds: [embed] });
    },
};