const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const Event = require('../../models/pets/events');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spawn-boss')
        .setDescription('Spawns a boss for testing purposes.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the boss to spawn.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('hp')
                .setDescription('The HP of the boss.')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const bossName = interaction.options.getString('name');
        const bossHp = interaction.options.getInteger('hp');

        const newEvent = new Event({
            name: bossName,
            type: 'world_boss',
            bossHp: bossHp,
            participants: new Map(),
            rewards: { all: 'currency' },
            isTest: true, // Flag to indicate a test boss
        });

        await newEvent.save();

        const embed = new EmbedBuilder()
            .setTitle(`A wild ${bossName} has appeared!`)
            .setDescription(`It has ${bossHp} HP. Click the button to join the fight!`)
            .setColor('#ff0000');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`join_boss_${newEvent._id}`)
                    .setLabel('Join Fight')
                    .setStyle(ButtonStyle.Primary),
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
