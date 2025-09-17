const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { getEconomyProfile, updateWallet, updateGold, addToInventory } = require('../../models/economy');
const petShopItems = require('../../data/petShopItems');

const allItems = Object.values(petShopItems).flat();

const getItemsByCategory = (category) => {
    if (category === 'all') return allItems;
    return allItems.filter(item => item.category.toLowerCase().replace(' ', '') === category);
};

const generateEmbed = (item, page, totalPages) => {
    const priceString = item.currency === 'gold' ? `${item.price} gold` : `$${item.price.toLocaleString()}`;
    const embed = new EmbedBuilder()
        .setTitle(`🐾 Pet Shop - ${item.category}`)
        .setColor('#4CAF50')
        .setImage(item.image)
        .setFooter({ text: `Item ${page + 1} of ${totalPages}` });

    let description = `**${item.name}**\n*${item.description}*\n\n**Price:** ${priceString}`;
    if (item.stats) { // For pets
        description += `\n**Stats:** Atk: ${item.stats.attack}, Def: ${item.stats.defense}, Spd: ${item.stats.speed}`;
    }
    description += `\n**ID:** \`${item.id}\``

    embed.setDescription(description);
    return embed;
};

const createComponents = (page, totalPages, currentCategory) => {
    const categoryOptions = [
        { label: 'All', value: 'all' },
        { label: 'Pets', value: 'pets' },
        { label: 'Pet Eggs', value: 'peteggs' },
        { label: 'Pet Supplies', value: 'petsupplies' },
    ].map(opt => ({ ...opt, default: opt.value === currentCategory }));

    const row1 = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('category_select')
            .setPlaceholder('Select a category...')
            .addOptions(categoryOptions)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('previous').setLabel('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId('buy').setLabel('Buy').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('next').setLabel('➡️').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1)
    );
    return [row1, row2];
};

async function handlePurchase(interaction, item) {
    const userId = interaction.user.id;
    const profile = await getEconomyProfile(userId);

    // Check for sufficient funds
    if (item.currency === 'gold') {
        if (profile.gold < item.price) {
            return interaction.reply({ content: 'You do not have enough gold for this item.', ephemeral: true });
        }
    } else {
        if (profile.wallet < item.price) {
            return interaction.reply({ content: `You need $${item.price.toLocaleString()}, but you only have $${profile.wallet.toLocaleString()}.`, ephemeral: true });
        }
    }

    // Check for non-stackable items
    if (!item.stackable && profile.inventory.some(i => i.id === item.id)) {
        return interaction.reply({ content: `You can only own one **${item.name}**.`, ephemeral: true });
    }

    // Process payment
    if (item.currency === 'gold') {
        await updateGold(userId, -item.price);
    } else {
        await updateWallet(userId, -item.price);
    }

    // Add to unified inventory
    const itemData = { 
        id: item.id, 
        name: item.name, 
        type: item.type, 
        purchaseDate: new Date(),
        purchasePrice: item.price
        // Add other relevant details from item if necessary
    };
    await addToInventory(userId, itemData);

    await interaction.reply({ content: `🎉 You have successfully purchased **1x ${item.name}**!`, ephemeral: true });
}


module.exports = {
    name: 'petshop',
    description: 'Visit the pet shop to buy pets, eggs, and supplies.',
    aliases: ['pshop'],

    async execute(message, args) {
        let currentCategory = 'all';
        let items = getItemsByCategory(currentCategory);
        let page = 0;

        const embed = generateEmbed(items[page], page, items.length);
        const components = createComponents(page, items.length, currentCategory);

        const shopMessage = await message.reply({ embeds: [embed], components: components });

        const collector = shopMessage.createMessageComponentCollector({ 
            componentType: ComponentType.StringSelect | ComponentType.Button, 
            time: 120000 // 2 minutes
        });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: "This isn't for you!", ephemeral: true });
            }

            if (interaction.isStringSelectMenu()) {
                currentCategory = interaction.values[0];
                items = getItemsByCategory(currentCategory);
                page = 0; // Reset page
            } else if (interaction.isButton()) {
                switch (interaction.customId) {
                    case 'previous':
                        page = Math.max(0, page - 1);
                        break;
                    case 'next':
                        page = Math.min(items.length - 1, page + 1);
                        break;
                    case 'buy':
                        const itemToBuy = items[page];
                        await handlePurchase(interaction, itemToBuy);
                        // We don't update after purchase as the reply is ephemeral
                        return; // Exit to avoid updating the message
                }
            }
            
            const newEmbed = generateEmbed(items[page], page, items.length);
            const newComponents = createComponents(page, items.length, currentCategory);
            await interaction.update({ embeds: [newEmbed], components: newComponents });
        });

        collector.on('end', () => {
            const finalComponents = createComponents(page, items.length, currentCategory);
            finalComponents.forEach(row => row.components.forEach(component => component.setDisabled(true)));
            shopMessage.edit({ components: finalComponents }).catch(console.error); // Ignore errors if message was deleted
        });
    },
};