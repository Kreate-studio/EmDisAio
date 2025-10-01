const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const KingdomConfig = require('../../models/kingdom/kingdomConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kingdom')
        .setDescription('Create a new kingdom announcement.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    async execute(interaction) {
        const config = await KingdomConfig.findOne({ guildId: interaction.guild.id });
        if (!config) {
            return interaction.reply({ content: 'The kingdom system has not been configured yet. Use `/setup-kingdom set` to set a channel first.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('kingdom_modal')
            .setTitle('Create Kingdom Announcement');

        const kingdomNameInput = new TextInputBuilder()
            .setCustomId('kingdom_name')
            .setLabel("Kingdom Name")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('kingdom_description')
            .setLabel("Description")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const inviteLinkInput = new TextInputBuilder()
            .setCustomId('kingdom_invite_link')
            .setLabel("Invite Link")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const tagsInput = new TextInputBuilder()
            .setCustomId('kingdom_tags')
            .setLabel("Tags (e.g., Roleplay, PvP, Economy)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const imageLinkInput = new TextInputBuilder()
            .setCustomId('kingdom_image_link')
            .setLabel("Image/Banner Link (Optional)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(kingdomNameInput),
            new ActionRowBuilder().addComponents(descriptionInput),
            new ActionRowBuilder().addComponents(inviteLinkInput),
            new ActionRowBuilder().addComponents(tagsInput),
            new ActionRowBuilder().addComponents(imageLinkInput)
        );

        await interaction.showModal(modal);
    },
};