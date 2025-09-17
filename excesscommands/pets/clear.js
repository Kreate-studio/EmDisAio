const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Pet } = require('../../models/pets/pets.js');
const { User } = require('../../models/users.js');

module.exports = {
    name: 'clear',
    description: 'Deletes all your pets and pet-related items.',
    async execute(message, args) {
        const userId = message.author.id;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_delete')
                    .setLabel('Confirm')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_delete')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary),
            );

        const reply = await message.reply({
            content: 'Are you sure you want to delete all of your pets and pet items? This action cannot be undone.',
            components: [row],
            ephemeral: true
        });

        const filter = i => i.user.id === message.author.id;

        try {
            const confirmation = await reply.awaitMessageComponent({ filter, time: 60000 });

            if (confirmation.customId === 'confirm_delete') {
                // Delete all pets owned by the user
                await Pet.deleteMany({ ownerId: userId });

                // Clear pet-related items from the user's inventory
                await User.updateOne({ userId: userId }, { $set: { petInventory: [], petEggs: [] } });

                await confirmation.update({ content: `All your pet data has been cleared.`, components: [] });
            } else if (confirmation.customId === 'cancel_delete') {
                await confirmation.update({ content: 'Action cancelled.', components: [] });
            }
        } catch (e) {
            await reply.edit({ content: 'Confirmation not received within 1 minute, cancelling.', components: [] });
        }
    },
};
