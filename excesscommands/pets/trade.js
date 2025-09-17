const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Pet = require('../../models/pets/pets');
const { getEconomyProfile, updateEconomyProfile } = require('../../models/economy');

module.exports = {
    name: 'trade',
    description: 'Trade pets, eggs, or supplies with another user.',
    async execute(message, args) {
        const partner = message.mentions.users.first();
        if (!partner || partner.bot || partner.id === message.author.id) {
            return message.reply('Please mention a valid user to trade with.');
        }

        const trader1 = message.author;
        const trader2 = partner;

        let offer1 = { pets: [], items: [] };
        let offer2 = { pets: [], items: [] };

        const tradeEmbed = () => new EmbedBuilder()
            .setTitle('Trade Offer')
            .setColor('#0099ff')
            .addFields(
                { name: `${trader1.username}\'s Offer`, value: formatOffer(offer1), inline: true },
                { name: `${trader2.username}\'s Offer`, value: formatOffer(offer2), inline: true }
            );

        const tradeMessage = await message.channel.send({ embeds: [tradeEmbed()], components: [createButtons(false, false)] });

        const collector = tradeMessage.createMessageComponentCollector({ time: 180000 });

        let ready1 = false;
        let ready2 = false;

        collector.on('collect', async interaction => {
            if (![trader1.id, trader2.id].includes(interaction.user.id)) {
                return interaction.reply({ content: "You are not part of this trade.", ephemeral: true });
            }

            const action = interaction.customId;

            if (action.startsWith('add_')) {
                const [_, itemType, itemName] = action.split('_');
                const user = interaction.user;
                const offer = user.id === trader1.id ? offer1 : offer2;
                const profile = await getEconomyProfile(user.id);

                if (itemType === 'pet') {
                    const pet = await Pet.findOne({ ownerId: user.id, name: new RegExp(`^${itemName}$`, 'i') });
                    if (pet) {
                        offer.pets.push(pet);
                    }
                } else {
                    const itemIndex = profile.inventory.findIndex(i => i.name.toLowerCase() === itemName);
                    if (itemIndex > -1) {
                        offer.items.push(profile.inventory[itemIndex]);
                    }
                }

                await interaction.update({ embeds: [tradeEmbed()] });
            }

            if (action === 'ready') {
                if (interaction.user.id === trader1.id) ready1 = !ready1; // Toggle ready state
                if (interaction.user.id === trader2.id) ready2 = !ready2; // Toggle ready state

                await interaction.update({ components: [createButtons(ready1, ready2)] });

                if (ready1 && ready2) {
                    await completeTrade();
                    collector.stop();
                }
            }

            if (action === 'cancel') {
                await tradeMessage.edit({ content: 'Trade cancelled.', embeds: [], components: [] });
                collector.stop();
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                tradeMessage.edit({ content: 'Trade timed out.', embeds: [], components: [] });
            }
        });

        async function completeTrade() {
            try {
                const profile1 = await getEconomyProfile(trader1.id);
                const profile2 = await getEconomyProfile(trader2.id);

                // Transfer pets from trader1 to trader2
                for (const pet of offer1.pets) {
                    await Pet.findByIdAndUpdate(pet._id, { ownerId: trader2.id });
                }
                // Transfer pets from trader2 to trader1
                for (const pet of offer2.pets) {
                    await Pet.findByIdAndUpdate(pet._id, { ownerId: trader1.id });
                }

                // Update inventories
                profile1.inventory = profile1.inventory.filter(item => !offer1.items.some(o => o.id === item.id));
                profile2.inventory.push(...offer1.items);

                profile2.inventory = profile2.inventory.filter(item => !offer2.items.some(o => o.id === item.id));
                profile1.inventory.push(...offer2.items);

                await updateEconomyProfile(trader1.id, { inventory: profile1.inventory });
                await updateEconomyProfile(trader2.id, { inventory: profile2.inventory });

                await tradeMessage.edit({ content: 'Trade successful!', embeds: [], components: [] });
            } catch (error) {
                console.error('Error completing trade:', error);
                await tradeMessage.edit({ content: 'An error occurred during the trade. Please check the logs.', embeds: [], components: [] });
            }
        }
    }
};

function formatOffer(offer) {
    const pets = offer.pets.map(p => `🐾 ${p.name}`).join('\n') || 'None';
    const items = offer.items.map(i => `📦 ${i.name}`).join('\n') || 'None';
    return `${pets}\n${items}`.substring(0, 1024); // Limit field value size
}

function createButtons(ready1, ready2) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('ready').setLabel(ready1 ? 'Unready' : 'Ready').setStyle(ready1 ? ButtonStyle.Secondary : ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
        );
}
