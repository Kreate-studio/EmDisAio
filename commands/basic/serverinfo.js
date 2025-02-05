const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const lang = require('../../events/loadLanguage');
const cmdIcons = require('../../UI/icons/commandicons');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription(lang.serverInfoDescription),
    async execute(interaction) {
        await interaction.deferReply();
        
        const server = interaction.guild;
        const emojis = server.emojis.cache;
        const roles = server.roles.cache.filter(role => role.id !== server.id); 
        const channels = server.channels.cache;
        const supportServerLink = lang.supportServerLink;
        const textChannels = channels.filter(channel => channel.type === 0).size;
        const voiceChannels = channels.filter(channel => channel.type === 2).size;
        const categories = channels.filter(channel => channel.type === 4).size;
        const stageChannels = channels.filter(channel => channel.type === 13).size;
        const totalChannels = textChannels + voiceChannels + stageChannels + categories;

        try {
            const owner = await server.members.fetch(server.ownerId);
            if (!owner) {
                throw new Error('Server owner not found.');
            }

            const boosters = server.premiumSubscriptionCount;
            const boostLevel = server.premiumTier;

            const embeds = [
                new EmbedBuilder()
                    .setColor('#FFFFFF')
                    .setAuthor({
                        name: lang.serverInfoTitle,
                        iconURL: cmdIcons.serverinfoIcon,
                        url: supportServerLink
                    })
                    .setThumbnail(server.iconURL({ format: 'png', dynamic: true, size: 1024 }))
                    .addFields([
                        { name: lang.serverInfoFields.serverName, value: `\`\`\`${server.name}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.serverOwner, value: `\`\`\`${owner.user.tag}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.serverOwnerId, value: `\`\`\`${server.ownerId}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.serverId, value: `\`\`\`${server.id}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.members, value: `\`\`\`${server.memberCount}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.membersNonBots, value: `\`\`\`${server.members.cache.filter(member => !member.user.bot).size}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.bots, value: `\`\`\`${server.members.cache.filter(member => member.user.bot).size}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.serverBoosts, value: `\`\`\`${boosters} (Level: ${boostLevel})\`\`\``, inline: true },
                        { name: lang.serverInfoFields.categories, value: `\`\`\`${categories}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.totalChannels, value: `\`\`\`${totalChannels}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.textChannels, value: `\`\`\`${textChannels}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.voiceChannels, value: `\`\`\`${voiceChannels}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.stageChannels, value: `\`\`\`${stageChannels}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.emojis, value: `\`\`\`${emojis.size}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.normalEmojis, value: `\`\`\`${emojis.filter(emoji => !emoji.animated).size}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.animatedEmojis, value: `\`\`\`${emojis.filter(emoji => emoji.animated).size}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.stickers, value: `\`\`\`${server.stickers.cache.size}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.roles, value: `\`\`\`${roles.size}\`\`\``, inline: true },
                        { name: lang.serverInfoFields.serverCreatedOn, value: `\`\`\`${server.createdAt.toLocaleString()}\`\`\``, inline: true },
                    ])
                    .setTimestamp(),
                new EmbedBuilder()
                    .setColor('#FFFFFF')
                    .setTitle('Roles')
                    .setDescription(roles.sort((a, b) => b.position - a.position).map(role => `<@&${role.id}>`).join(', ')),
                new EmbedBuilder()
                    .setColor('#FFFFFF')
                    .setTitle('Emojis')
                    .setDescription(emojis.map(e => e.toString()).join(' ')),
            ];

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Secondary)
                );

            let currentPage = 0;

            await interaction.editReply({ embeds: [embeds[currentPage]], components: [row] });

            const filter = i => i.customId === 'previous' || i.customId === 'next';
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'previous') {
                    currentPage--;
                } else if (i.customId === 'next') {
                    currentPage++;
                }

                if (currentPage <= 0) {
                    currentPage = 0;
                    row.components[0].setDisabled(true);
                } else {
                    row.components[0].setDisabled(false);
                }

                if (currentPage >= embeds.length - 1) {
                    currentPage = embeds.length - 1;
                    row.components[1].setDisabled(true);
                } else {
                    row.components[1].setDisabled(false);
                }

                await i.update({ embeds: [embeds[currentPage]], components: [row] });
            });

            collector.on('end', collected => {
                console.log(`Collected ${collected.size} interactions.`);
            });

        } catch (error) {
            //console.error('Error fetching server information:', error);
            await interaction.editReply(lang.serverInfoError);
        }
    },
};
