const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getEconomyProfile, updateWallet, updateGold, addToInventory } = require('../../models/economy');
const { shopItems } = require('../../data/shopItems');
const { v4: uuidv4 } = require('uuid');

const allItems = Object.values(shopItems).flat();
const EXPENSIVE_ITEM_THRESHOLD = 20000; // Confirmation for purchases over this amount

async function processPurchase(interaction, userId, profile, item, quantity, totalPrice, currency) {
    try {
        // For non-stackable items, if the user tries to buy one they already have.
        if (!item.stackable && profile.inventory.some(i => i.id === item.id)) {
            return interaction.update({ content: `You already own a(n) **${item.name}**.`, components: [], embeds: [] });
        }

        // Add the item(s) to the user's inventory
        if (item.id === 'pet_food_pack') {
            for (let i = 0; i < 10 * quantity; i++) {
                await addToInventory(userId, { id: 'pet_food', name: 'Pet Food', type: 'consumable', uniqueId: uuidv4() });
            }
        } else if (item.id === 'pet_toy_pack') {
            for (let i = 0; i < 10 * quantity; i++) {
                await addToInventory(userId, { id: 'pet_toy', name: 'Pet Toy', type: 'consumable', uniqueId: uuidv4() });
            }
        } else if (item.id === 'pet_medicine_pack') {
            for (let i = 0; i < 5 * quantity; i++) {
                await addToInventory(userId, { id: 'pet_medicine', name: 'Pet Medicine', type: 'consumable', uniqueId: uuidv4() });
            }
        } else {
            const itemData = {
                id: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity, // Include rarity for eggs
                purchaseDate: new Date(),
                purchasePrice: item.price,
                uniqueId: uuidv4()
            };
            for (let i = 0; i < quantity; i++) {
                await addToInventory(userId, itemData);
            }
        }

        // Deduct money from wallet or gold
        if (currency === 'gold') {
            await updateGold(userId, -totalPrice);
        } else {
            await updateWallet(userId, -totalPrice);
        }

        const embed = new EmbedBuilder()
            .setTitle('✅ Purchase Successful!')
            .setDescription(`You have successfully purchased **${quantity}x ${item.name}** for **${currency === 'gold' ? 'G': '$'}${totalPrice.toLocaleString()}**.`) 
            .setColor('#2ECC71');

        await interaction.update({ embeds: [embed], components: [] });

    } catch (error) {
        console.error('Error processing purchase:', error);
        await interaction.update({ content: 'Something went wrong while completing your purchase.', components: [], embeds: [] });
    }
}


module.exports = {
    name: 'buy',
    description: 'Purchase an item or multiple items from the shop.',
    async execute(message, args) {
        const itemId = args[0]?.toLowerCase();
        const quantity = parseInt(args[1]) || 1;

        if (!itemId) {
            return message.reply('Please provide the ID of the item you want to buy. Use `shop` to see IDs.');
        }

        if (isNaN(quantity) || quantity < 1) {
            return message.reply('Please provide a valid quantity.');
        }

        const item = allItems.find(i => i.id.toLowerCase() === itemId);

        if (!item) {
            return message.reply(`We couldn\'t find an item with the ID \`${itemId}\`.`);
        }

        if (item.price === null) {
            return message.reply('This item cannot be purchased from the shop.');
        }

        if (quantity > 1 && !item.stackable) {
            return message.reply(`You can only own one **${item.name}** at a time.`);
        }

        const userId = message.author.id;
        const profile = await getEconomyProfile(userId);
        const totalPrice = item.price * quantity;
        const currency = item.currency || 'wallet';

        if ((currency === 'gold' && profile.gold < totalPrice) || (currency === 'wallet' && profile.wallet < totalPrice)) {
            return message.reply(`You don\'t have enough ${currency}. You need **${currency === 'gold' ? 'G': '$'}${totalPrice.toLocaleString()}**, but you only have **${currency === 'gold' ? 'G': '$'}${profile[currency].toLocaleString()}**.`);
        }

        // Confirmation for expensive items
        if (totalPrice >= EXPENSIVE_ITEM_THRESHOLD && currency === 'wallet') {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('confirm_purchase').setLabel('Confirm').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('cancel_purchase').setLabel('Cancel').setStyle(ButtonStyle.Danger)
            );

            const confirmationMsg = await message.reply({
                content: `Are you sure you want to purchase **${quantity}x ${item.name}** for **$${totalPrice.toLocaleString()}**?`,
                components: [row],
                fetchReply: true
            });

            const collector = confirmationMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });

            collector.on('collect', async interaction => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: "This isn't for you!", ephemeral: true });
                }

                if (interaction.customId === 'confirm_purchase') {
                    await processPurchase(interaction, userId, profile, item, quantity, totalPrice, currency);
                } else {
                    await interaction.update({ content: 'Purchase canceled.', components: [] });
                }
                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    confirmationMsg.edit({ content: 'Confirmation timed out. Purchase canceled.', components: [] });
                }
            });

        } else {
            // Auto-confirm for cheaper items or gold purchases
            const mockInteraction = { 
                update: async (options) => { 
                    if (options.embeds) { 
                        await message.channel.send({ embeds: options.embeds, components: [] });
                    } else {
                        await message.channel.send(options);
                    }
                } 
            };
            await processPurchase(mockInteraction, userId, profile, item, quantity, totalPrice, currency);
        }
    },
};