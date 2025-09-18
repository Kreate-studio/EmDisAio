const { EmbedBuilder } = require('discord.js');
const petShopItems = require('../../data/petShopItems');

module.exports = {
    name: 'petlist',
    description: 'List all available pets and items in the shop.',
    aliases: ['pl'],
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🐾 Pet Shop List 🐾')
            .setColor('#4CAF50');

        const categoryOrder = ["Pets", "Pet Eggs", "Pet Supplies", "Pet Toys"];

        for (const category of categoryOrder) {
            const items = petShopItems[category];
            if (!items || items.length === 0) continue;

            const itemStrings = items.map(item => {
                const priceString = item.rarity === 'Exclusive'
                    ? 'Exclusive (Admin Give Only)'
                    : item.price === null
                        ? 'Not for sale'
                        : item.currency === 'gold'
                            ? `${item.price} gold`
                            : `$${item.price.toLocaleString()}`;
                return `**${item.name}** - ${priceString}\n*${item.description}*\n\n`;
            });

            let currentFieldValue = '';
            const fields = [];
            for (const itemString of itemStrings) {
                if (currentFieldValue.length + itemString.length <= 1024) {
                    currentFieldValue += itemString;
                } else {
                    fields.push({ name: category, value: currentFieldValue });
                    currentFieldValue = itemString;
                }
            }
            if (currentFieldValue.length > 0) {
                fields.push({ name: category, value: currentFieldValue });
            }

            if (fields.length > 1) {
                for (let i = 0; i < fields.length; i++) {
                    fields[i].name = `${category} (Part ${i + 1})`;
                }
            }
            embed.addFields(fields);
        }

        if (!embed.data.fields || embed.data.fields.length === 0) {
            embed.setDescription("No items found.");
        }

        if (embed.data.fields && embed.data.fields.length > 25) {
            return message.reply('The list is too long to display. Please try a more specific command.');
        }

        return message.reply({ embeds: [embed] });
    },
};