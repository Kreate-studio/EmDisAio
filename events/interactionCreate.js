const fs = require('fs');
const path = require('path');
const lang = require('./loadLanguage');
const client = require('../main');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const VerificationConfig = require('../models/gateVerification/verificationConfig');
const verificationCodes = new Map();
const SuggestionVote = require('../models/suggestions/SuggestionVote');
const truths = require('../data/truthordare/truth.json');
const dares = require('../data/truthordare/dare.json');
const nsfwTruths = require('../data/truthordare/nsfw_truth.json');
const nsfwDares = require('../data/truthordare/nsfw_dare.json');
const DisabledCommand = require('../models/commands/DisabledCommands');
const PartnerConfig = require('../models/partnership/partnerConfig');
const EventConfig = require('../models/events/eventConfig');
const AiChat = require('../models/aichat/aiModel');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {

        // 🟣 Button Logic
        if (interaction.isButton()) {
             // If the interaction is part of the new boss system, ignore it.
            if (interaction.customId && interaction.customId.startsWith('boss-')) {
                return;
            }
            const { customId, user } = interaction;

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
                    return interaction.reply({ content: 'This command can only be used in NSFW channels.', flags: [MessageFlags.Ephemeral] });
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
                    await interaction.reply({ content: '⚠️ Could not register your vote. Please try again later.', flags: [MessageFlags.Ephemeral] });
                }
            }
        }
        // Handle String Select Menus
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId && interaction.customId.startsWith('boss-')) {
                return;
            }


        }
        // Handle Modal Submissions
        else if (interaction.isModalSubmit()) {
             if (interaction.customId && interaction.customId.startsWith('boss-')) {
                return;
            }

            if (interaction.customId === 'verify_modal') {
                const userId = interaction.user.id;
                const userInput = interaction.fields.getTextInputValue('verify_input');
                const correctCode = verificationCodes.get(userId);

                if (!correctCode || userInput !== correctCode) {
                    return interaction.reply({ content: 'Verification failed! Try again.', flags: [MessageFlags.Ephemeral] });
                }

                const config = await VerificationConfig.findOne({ guildId: interaction.guild.id });
                if (!config) return;

                const member = interaction.guild.members.cache.get(userId);
                const verifiedRole = interaction.guild.roles.cache.get(config.verifiedRoleId);
                if (!verifiedRole) return interaction.reply({ content: '⚠️ Verified role not found.', flags: [MessageFlags.Ephemeral] });

                const unverifiedRole = interaction.guild.roles.cache.get(config.unverifiedRoleId);
                if (unverifiedRole) {
                    await member.roles.remove(unverifiedRole);
                }
                await member.roles.add(verifiedRole);
                verificationCodes.delete(userId);

                await interaction.reply({ content: '✅ Verification successful! You now have access to the server.', flags: [MessageFlags.Ephemeral] });
            }

            if (interaction.customId === 'partner_modal') {
                const config = await PartnerConfig.findOne({ guildId: interaction.guild.id });
                if (!config) {
                    return interaction.reply({ content: 'The partnership system has not been configured yet. Use `/setup-partner set` to set a channel first.', ephemeral: true });
                }
                
                const channel = await client.channels.fetch(config.channelId);
                if (!channel) {
                    return interaction.reply({ content: 'The configured partner channel could not be found.', ephemeral: true });
                }

                const serverName = interaction.fields.getTextInputValue('partner_server_name');
                const description = interaction.fields.getTextInputValue('partner_description');
                const inviteLink = interaction.fields.getTextInputValue('partner_invite_link');
                const tags = interaction.fields.getTextInputValue('partner_tags');
                const imageLink = interaction.fields.getTextInputValue('partner_image_link');

                const embed = new EmbedBuilder()
                    .setTitle(serverName)
                    .setDescription(description)
                    .setColor('#6366f1')
                    .addFields(
                        { name: '🔗 Invite Link', value: `[Click here to join!](${inviteLink})`, inline: true },
                        { name: '🏷️ Tags', value: tags, inline: true }
                    )
                    .setFooter({ text: `Partnered with ${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setTimestamp();

                if (imageLink) {
                    embed.setImage(imageLink);
                }

                try {
                    await channel.send({ embeds: [embed] });
                    await interaction.reply({ content: `✅ Partner embed has been successfully sent to <#${channel.id}>!`, ephemeral: true });
                } catch (error) {
                    console.error('Error sending partner embed:', error);
                    await interaction.reply({ content: 'There was an error sending the partner embed. Please check my permissions in that channel.', ephemeral: true });
                }
            }

            if (interaction.customId === 'event_modal') {
                const config = await EventConfig.findOne({ guildId: interaction.guild.id });
                if (!config) {
                    return interaction.reply({ content: 'The event system has not been configured yet. Use `/setup-event set` to set a channel first.', ephemeral: true });
                }

                const channel = await client.channels.fetch(config.channelId);
                if (!channel) {
                    return interaction.reply({ content: 'The configured event channel could not be found.', ephemeral: true });
                }

                const title = interaction.fields.getTextInputValue('event_title');
                const description = interaction.fields.getTextInputValue('event_description');
                const tags = interaction.fields.getTextInputValue('event_tags');
                const image = interaction.fields.getTextInputValue('event_image');
                const link = interaction.fields.getTextInputValue('event_link');

                const embed = new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(description)
                    .setColor('#ffea00')
                    .addFields({ name: '🏷️ Tags', value: tags, inline: true })
                    .setFooter({ text: `Event announced by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                if (image) {
                    embed.setImage(image);
                }

                const components = [];
                if (link) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Learn More')
                            .setStyle(ButtonStyle.Link)
                            .setURL(link)
                    );
                    components.push(row);
                }

                try {
                    await channel.send({ embeds: [embed], components });
                    await interaction.reply({ content: `✅ Event announcement has been successfully sent to <#${channel.id}>!`, ephemeral: true });
                } catch (error) {
                    console.error('Error sending event embed:', error);
                    await interaction.reply({ content: 'There was an an error sending the event announcement. Please check my permissions in that channel.', ephemeral: true });
                }
            }

            if (interaction.customId === 'edit_lore_modal') {
                await interaction.deferReply({ ephemeral: true });

                const guildId = interaction.guild.id;
                const bio = interaction.fields.getTextInputValue('bio_input');
                const lore = interaction.fields.getTextInputValue('lore_input');
                const hierarchy = interaction.fields.getTextInputValue('hierarchy_input');

                try {
                    await AiChat.updateLore(guildId, bio, lore, hierarchy, interaction.user.id);
                    await interaction.editReply({
                        content: '✅ AI lore and personality have been successfully updated!'
                    });
                } catch (error) {
                    console.error(`Error updating lore for guild ${guildId}:`, error);
                    await interaction.editReply({
                        content: '❌ There was an error saving your changes. Please try again later.'
                    });
                }
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
                return interaction.reply({ content: `❌ This command is disabled in this server.`, flags: [MessageFlags.Ephemeral] });
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] });
                }
            }
        }
    },
};

// --- FIXED COMMAND LOADER ---
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).reduce((files, folder) => {
    const folderPath = path.join(commandsPath, folder);
    if (fs.statSync(folderPath).isDirectory()) {
        const fileNames = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of fileNames) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            command.category = folder;

            // Load slash command
            if (command.data && command.data.name) {
                files.set(command.data.name, command);
            }
            // Load prefix command and its aliases
            else if (command.name) {
                files.set(command.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => files.set(alias, command));
                }
            }
        }
    }
    return files;
}, new Map());

client.commands = commandFiles;
