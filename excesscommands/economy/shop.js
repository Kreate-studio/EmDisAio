const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { shopItems } = require('../../data/shopItems');

const ITEMS_PER_PAGE = 4;

// Helper to create the embed for a given page
const generateEmbed = (category, page, totalPages) => {
    const items = shopItems[category];
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const currentItems = items.slice(start, end);

    const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);

    const embed = new EmbedBuilder()
        .setTitle(`🛍️ Shop - ${capitalizedCategory}`)
        .setColor('#2ECC71')
        .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

    if (currentItems.length === 0) {
        embed.setDescription('There are no items in this category right now.');
    } else {
        currentItems.forEach(item => {
            embed.addFields({
                name: `${item.name} - $${item.price.toLocaleString()}`,
                value: `ID: \`${item.id}\`\n${item.description}`
            });
        });
    }
    return embed;
};

// Helper to create the action rows (buttons and select menu)
const generateComponents = (category, page, totalPages) => {
    const categoryOptions = Object.keys(shopItems).map(key => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: key,
        default: key === category,
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('category_select')
        .setPlaceholder('Change Category')
        .addOptions(categoryOptions);

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('previous_page')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId('next_page')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
    );

    return [new ActionRowBuilder().addComponents(selectMenu), buttons];
};

module.exports = {
    name: 'shop',
    description: 'Browse items available for purchase in an interactive menu.',
    aliases: ['store'],
    async execute(message, args) {
        const initialCategory = Object.keys(shopItems)[0];
        let currentCategory = initialCategory;
        let currentPage = 0;
        let totalPages = Math.ceil(shopItems[currentCategory].length / ITEMS_PER_PAGE);

        const initialEmbed = generateEmbed(currentCategory, currentPage, totalPages);
        const initialComponents = generateComponents(currentCategory, currentPage, totalPages);

        const shopMessage = await message.reply({ embeds: [initialEmbed], components: initialComponents });

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
                currentPage = 0;
                totalPages = Math.ceil(shopItems[currentCategory].length / ITEMS_PER_PAGE);
            } else if (interaction.isButton()) {
                if (interaction.customId === 'next_page') {
                    currentPage++;
                } else if (interaction.customId === 'previous_page') {
                    currentPage--;
                }
            }

            const newEmbed = generateEmbed(currentCategory, currentPage, totalPages);
            const newComponents = generateComponents(currentCategory, currentPage, totalPages);
            await interaction.update({ embeds: [newEmbed], components: newComponents });
        });

        collector.on('end', () => {
            const finalComponents = generateComponents(currentCategory, currentPage, totalPages);
            finalComponents.forEach(row => {
                row.components.forEach(component => {
                    component.setDisabled(true);
                });
            });
            shopMessage.edit({ components: finalComponents });
        });
    },
};