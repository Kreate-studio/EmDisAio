const fs = require('fs');
const path = require('path');
const { categories } = require('../config.json');
const lang = require('./loadLanguage');
const client = require('../main');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');
const VerificationConfig = require('../models/gateVerification/verificationConfig');
const verificationCodes = new Map();
const SuggestionVote = require('../models/suggestions/SuggestionVote');
const truths = require('../data/truthordare/truth.json');
const dares = require('../data/truthordare/dare.json');
const nsfwTruths = require('../data/truthordare/nsfw_truth.json');
const nsfwDares = require('../data/truthordare/nsfw_dare.json');
const DisabledCommand = require('../models/commands/DisabledCommands');
const Event = require('../models/pets/events');
const GuildSettings = require('../models/guild/GuildSettings');
const Pet = require('../models/pets/pets');
const { updateGold } = require('../models/economy');
const { startBattle } = require('../battles/fight');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // 🟣 Button Logic
        if (interaction.isButton()) {
            const { customId, user } = interaction;

            // Handle Boss Fight Join
            if (customId.startsWith('join_boss_')) {
                const eventId = customId.split('_')[2];
                const event = await Event.findById(eventId);
                const guildSettings = await GuildSettings.findOne({ guildId: interaction.guild.id });

                if (!event) {
                    return interaction.reply({ content: 'This boss fight is no longer available.', ephemeral: true });
                }

                if (event.participants.has(user.id)) {
                    return interaction.reply({ content: 'You have already joined this fight.', ephemeral: true });
                }

                event.participants.set(user.id, { damage: 0 });
                await event.save();

                const minParticipants = event.isTest ? 1 : guildSettings.minBossParticipants;

                const participantsList = Array.from(event.participants.keys()).map(userId => `<@${userId}>`).join('\n');
                const embed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setDescription(`A fearsome **${event.name}** has spawned! It has **${event.bossHp}** HP.\n\n**Participants (${event.participants.size}/${minParticipants}):**\n${participantsList}`);

                await interaction.update({ embeds: [embed] });

                // Check if the fight can start
                if (event.participants.size >= minParticipants) {
                    // Create a public thread for the battle
                    const thread = await interaction.channel.threads.create({
                        name: `⚔️ ${event.name} Battle`,
                        autoArchiveDuration: 60,
                        startMessage: interaction.message,
                        type: ChannelType.PublicThread,
                        reason: 'Boss battle started',
                    });

                    // Add participants to the thread
                    const participants = Array.from(event.participants.keys());
                    for (const userId of participants) {
                        const member = await interaction.guild.members.fetch(userId).catch(() => null);
                        if (member) {
                            await thread.members.add(member);
                        }
                    }

                    await interaction.channel.send(`The battle against **${event.name}** has begun in the thread!`);

                    await startBattle(thread, event, participants, interaction);

                    // Clean up the event and disable the original message button
                    await Event.findByIdAndDelete(eventId);
                    const disabledButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(customId)
                            .setLabel('Fight Over')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );
                    await interaction.message.edit({ components: [disabledButtons] });
                }
                return;
            }

            // Handle Button Interactions (Verification Button)
            if (interaction.customId === 'verify_button') {
                const verificationCode = Math.random().toString(36).slice(2, 8).toUpperCase();
                verificationCodes.set(interaction.user.id, verificationCode);

                const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('Verification');
                const input = new TextInputBuilder().setCustomId('verify_input').setLabel(`Enter this code: ${verificationCode}`).setStyle(TextInputStyle.Short).setRequired(true);
                const row = new ActionRowBuilder().addComponents(input);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }
            if (customId.startsWith('tod_')) {
                await interaction.deferUpdate();

                let result;
                if (customId === 'tod_truth') {
                    result = `🧠 **Truth:** ${truths[Math.floor(Math.random() * truths.length)]}`;
                } else if (customId === 'tod_dare') {
                    result = `🔥 **Dare:** ${dares[Math.floor(Math.random() * dares.length)]}`;
                } else if (customId === 'tod_random') {
                    const pool = Math.random() < 0.5 ? truths : dares;
                    const label = pool === truths ? '🧠 **Truth:**' : '🔥 **Dare:**';
                    result = `${label} ${pool[Math.floor(Math.random() * pool.length)]}`;
                }

                const embed = new EmbedBuilder().setTitle('🎲 Your Truth or Dare!').setDescription(result).setColor('#00ccff').setFooter({ text: `${user.username} picked this`, iconURL: user.displayAvatarURL() }).setTimestamp();
                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('tod_truth').setLabel('Truth 🧠').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('tod_dare').setLabel('Dare 🔥').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('tod_random').setLabel('Random 🎲').setStyle(ButtonStyle.Secondary)
                );
                return interaction.channel.send({ embeds: [embed], components: [buttons] });
            }
            if (customId.startsWith('nsfw_tod_')) {
                if (!interaction.channel.nsfw) {
                    return interaction.reply({ content: 'This command can only be used in NSFW channels.', ephemeral: true });
                }
                await interaction.deferUpdate();

                let result;
                if (customId === 'nsfw_tod_truth') {
                    result = `🧠 **Truth:** ${nsfwTruths[Math.floor(Math.random() * nsfwTruths.length)]}`;
                } else if (customId === 'nsfw_tod_dare') {
                    result = `🔥 **Dare:** ${nsfwDares[Math.floor(Math.random() * nsfwDares.length)]}`;
                } else if (customId === 'nsfw_tod_random') {
                    const pool = Math.random() < 0.5 ? nsfwTruths : nsfwDares;
                    const label = pool === nsfwTruths ? '🧠 **Truth:**' : '🔥 **Dare:**';
                    result = `${label} ${pool[Math.floor(Math.random() * pool.length)]}`;
                }

                const embed = new EmbedBuilder().setTitle('🔥 NSFW Truth or Dare! 🔥').setDescription(result).setColor('#ff0000').setFooter({ text: `${user.username} picked this`, iconURL: user.displayAvatarURL() }).setTimestamp();
                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('nsfw_tod_truth').setLabel('Truth 🧠').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('nsfw_tod_dare').setLabel('Dare 🔥').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('nsfw_tod_random').setLabel('Random 🎲').setStyle(ButtonStyle.Secondary)
                );
                return interaction.channel.send({ embeds: [embed], components: [buttons] });
            }
            if (['suggestion_yes', 'suggestion_no'].includes(customId)) {
                const messageId = interaction.message.id;
                const voteType = customId === 'suggestion_yes' ? 'yes' : 'no';

                try {
                    await SuggestionVote.findOneAndUpdate({ messageId, userId: user.id }, { vote: voteType, votedAt: new Date() }, { upsert: true });

                    const allVotes = await SuggestionVote.find({ messageId });
                    const yesVotes = allVotes.filter(v => v.vote === 'yes').length;
                    const noVotes = allVotes.filter(v => v.vote === 'no').length;

                    const embed = EmbedBuilder.from(interaction.message.embeds[0])
                        .setFields(
                            { name: 'Submitted by', value: interaction.message.embeds[0].fields[0].value, inline: true },
                            { name: '👍 Yes Votes', value: `${yesVotes}`, inline: true },
                            { name: '👎 No Votes', value: `${noVotes}`, inline: true }
                        );
                    await interaction.update({ embeds: [embed] });
                } catch (err) {
                    console.error('❌ Error handling suggestion vote:', err);
                    await interaction.reply({ content: '⚠️ Could not register your vote. Please try again later.', ephemeral: true });
                }
            }
        }
        // Handle Modal Submissions
        else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'verify_modal') {
                const userId = interaction.user.id;
                const userInput = interaction.fields.getTextInputValue('verify_input');
                const correctCode = verificationCodes.get(userId);

                if (!correctCode || userInput !== correctCode) {
                    return interaction.reply({ content: 'Verification failed! Try again.', ephemeral: true });
                }

                const config = await VerificationConfig.findOne({ guildId: interaction.guild.id });
                if (!config) return;

                const member = interaction.guild.members.cache.get(userId);
                const verifiedRole = interaction.guild.roles.cache.get(config.verifiedRoleId);
                if (!verifiedRole) return interaction.reply({ content: '⚠️ Verified role not found.', ephemeral: true });

                const unverifiedRole = interaction.guild.roles.cache.get(config.unverifiedRoleId);
                if (unverifiedRole) {
                    await member.roles.remove(unverifiedRole);
                }
                await member.roles.add(verifiedRole);
                verificationCodes.delete(userId);

                await interaction.reply({ content: '✅ Verification successful! You now have access to the server.', ephemeral: true });
            }
        }
        // Handle Slash Commands
        else if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            const subcommandName = interaction.options.getSubcommand(false);
            const isDisabled = await DisabledCommand.findOne({
                guildId: interaction.guild.id,
                commandName: interaction.commandName,
                ...(subcommandName ? { subcommandName } : {})
            });

            if (isDisabled) {
                return interaction.reply({ content: `❌ This command is disabled in this server.`, ephemeral: true });
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }
    },
};

// Command loader (remains unchanged)
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).reduce((files, folder) => {
    const folderPath = path.join(commandsPath, folder);
    if (fs.statSync(folderPath).isDirectory()) {
        const fileNames = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of fileNames) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            if (command.data && command.data.name) {
                command.category = folder;
                files.set(command.data.name, command);
            }
        }
    }
    return files;
}, new Map());

client.commands = commandFiles;
