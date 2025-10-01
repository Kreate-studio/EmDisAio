const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const KingdomConfig = require('../../models/kingdom/kingdomConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-kingdom')
        .setDescription('Configure the kingdom announcement channel.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Sets the channel for kingdom announcements.')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel to designate for kingdoms.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes the kingdom channel configuration.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Views the current kingdom channel configuration.')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            if (subcommand === 'set') {
                const channel = interaction.options.getChannel('channel');
                await KingdomConfig.findOneAndUpdate({ guildId }, { channelId: channel.id }, { upsert: true });
                await interaction.reply({ content: `✅ Kingdom announcement channel has been set to <#${channel.id}>.`, ephemeral: true });
            } 
            else if (subcommand === 'remove') {
                const deleted = await KingdomConfig.findOneAndDelete({ guildId });
                if (deleted) {
                    await interaction.reply({ content: '🗑️ Kingdom channel configuration has been removed.', ephemeral: true });
                } else {
                    await interaction.reply({ content: '⚠️ No kingdom channel was configured.', ephemeral: true });
                }
            } 
            else if (subcommand === 'view') {
                const config = await KingdomConfig.findOne({ guildId });
                if (config) {
                    await interaction.reply({ content: `ℹ️ The current kingdom announcement channel is <#${config.channelId}>.`, ephemeral: true });
                } else {
                    await interaction.reply({ content: '⚠️ No kingdom channel is currently configured.', ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Error managing kingdom config:', error);
            await interaction.reply({ content: 'An error occurred while managing the kingdom configuration.', ephemeral: true });
        }
    },
};