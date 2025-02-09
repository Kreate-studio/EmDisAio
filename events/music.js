const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const { dynamicCard } = require("../UI/dynamicCard");
const path = require('path');
const musicIcons = require('../UI/icons/musicicons');
const { Riffy } = require('riffy');
const { autoplayCollection } = require('../mongodb');
module.exports = (client) => {
    if (config.excessCommands.lavalink) {
        const nodes = [
            {
                host: config.lavalink.lavalink.host,
                password: config.lavalink.lavalink.password,
                port: config.lavalink.lavalink.port,
                secure: config.lavalink.lavalink.secure
            }
        ];

        client.riffy = new Riffy(client, nodes, {
            send: (payload) => {
                const guild = client.guilds.cache.get(payload.d.guild_id);
                if (guild) guild.shard.send(payload);
            },
            defaultSearchPlatform: "ytmsearch",
            restVersion: "v4",
        });

        client.riffy.on('nodeConnect', (node) => {
            console.log(`\x1b[34m[ LAVALINK CONNECTION ]\x1b[0m Node connected: \x1b[32m${node.name}\x1b[0m`);
        });

        client.riffy.on('nodeError', (node, error) => {
            console.error(`\x1b[31m[ LAVALINK ]\x1b[0m Node \x1b[32m${node.name}\x1b[0m had an error: \x1b[33m${error.message}\x1b[0m`);
        });

        client.riffy.on('trackStart', async (player, track) => {
            const channel = client.channels.cache.get(player.textChannel);
            

            function formatTime(ms) {
                if (!ms || ms === 0) return "0:00";
                const totalSeconds = Math.floor(ms / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                return `${hours > 0 ? hours + ":" : ""}${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            }

            try {
                // Disable previous message's buttons if it exists.
                if (player.currentMessageId) {
                    try {
                        const oldMessage = await channel.messages.fetch(player.currentMessageId);
                        if (oldMessage) {
                            const disabledComponents = oldMessage.components.map(row => {
                                return new ActionRowBuilder().addComponents(
                                    row.components.map(button => ButtonBuilder.from(button).setDisabled(true))
                                );
                            });
                            await oldMessage.edit({ components: disabledComponents });
                        }
                    } catch (err) {
                        console.warn("Previous message not found (likely deleted), skipping edit.");
                    }
                }
        
                // Generate the song card image.
                const cardImage = await dynamicCard({
                    thumbnailURL: track.info.thumbnail,
                    songTitle: track.info.title,
                    songArtist: track.info.author,
                    trackRequester: track.requester ? track.requester.username : "All In One",
                    fontPath: path.join(__dirname, "../UI", "fonts", "AfacadFlux-Regular.ttf"),
                    backgroundColor: "#FF00FF",
                });
        
                const attachment = new AttachmentBuilder(cardImage, { name: 'songcard.png' });
        
                const description = `- Title: ${track.info.title} \n`+
               ` - Artist: ${track.info.author} \n`+
               ` - Length: ${formatTime(track.info.length)} (\`${track.info.length}ms\`) \n`+
               ` - Stream: ${track.info.stream ? "Yes" : "No"} \n`+
               ` - Seekable: ${track.info.seekable ? "Yes" : "No"} \n`+
               ` - URI: [Link](${track.info.uri}) \n`+
               ` - Source: ${track.info.sourceName} \n`+ 
               ` - Requested by: ${track.requester ? `<@${track.requester.id}>` : "Unknown"}`; 
                
                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Now Playing..", iconURL: musicIcons.playerIcon, url: "https://discord.gg/xQF9f9yUEM" })
                    .setDescription(description)
                    .setImage('attachment://songcard.png')
                    .setFooter({ text: 'Let the Beat Drop!', iconURL: musicIcons.footerIcon })
                    .setColor('#00c3ff');
        
                // Conditionally create buttons only if track.requester is defined.
                let components = [];
                if (track.requester && track.requester.id) {
                    const buttonsRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`volume_up_${track.requester.id}`).setEmoji('🔊').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`volume_down_${track.requester.id}`).setEmoji('🔉').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`pause_${track.requester.id}`).setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`resume_${track.requester.id}`).setEmoji('▶️').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`skip_${track.requester.id}`).setEmoji('⏭️').setStyle(ButtonStyle.Secondary)
                    );
        
                    const buttonsRow2 = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`stop_${track.requester.id}`).setEmoji('⏹️').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId(`clear_queue_${track.requester.id}`).setEmoji('🗑️').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`show_queue_${track.requester.id}`).setEmoji('📜').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`shuffle_${track.requester.id}`).setEmoji('🔀').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`loop_${track.requester.id}`).setEmoji('🔁').setStyle(ButtonStyle.Secondary)
                    );
        
                    components = [buttonsRow, buttonsRow2];
                }
                // If track.requester is undefined (for autoplay songs), no buttons are added.
        
                const message = await channel.send({
                    embeds: [embed],
                    files: [attachment],
                    components: components
                });
        
                player.currentMessageId = message.id;
            } catch (error) {
                console.error('Error creating or sending song card:', error);
            }
        });
        

        client.riffy.on('trackEnd', async (player, track) => {
            const channel = client.channels.cache.get(player.textChannel);
            if (player.currentMessageId) {
                try {
                    const oldMessage = await channel.messages.fetch(player.currentMessageId);
                    if (oldMessage) await oldMessage.delete();
                } catch (err) {
                    console.error("Failed to delete finished song message:", err);
                }
            }
        });

        client.riffy.on("queueEnd", async (player) => {
            const channel = client.channels.cache.get(player.textChannel);
            const guildId = player.guildId;
            
            const result = await autoplayCollection.findOne({ guildId });
            const autoplay = result ? result.autoplay : false;
            
            if (autoplay) {
                player.autoplay(player);
            } else {
                player.destroy();
                channel.send("Queue has ended.");
            }
            if (player.currentMessageId) {
                setTimeout(async () => {
                    try {
                        const finalMessage = await channel.messages.fetch(player.currentMessageId);
                        if (finalMessage) {
                            await finalMessage.delete();
                            //console.log("Final embed message has been deleted after delay.");
                        }
                    } catch (err) {
                        //console.error("Error deleting final embed message:", err);
                    }
                }, 2000); 
            }            
        });

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;


            const parts = interaction.customId.split('_');
            const userId = parts.pop();        
            const action = parts.join('_');   

           
            if (interaction.user.id !== userId) {
                return;
            }

            const player = client.riffy.players.get(interaction.guildId);
            if (!player) return interaction.reply({ content: 'No active player!', ephemeral: true });

            switch (action) {
                case 'volume_up':
                    player.setVolume(Math.min(player.volume + 10, 100));
                    return interaction.reply({ content: 'Volume increased!', ephemeral: true });

                case 'volume_down':
                    player.setVolume(Math.max(player.volume - 10, 0));
                    return interaction.reply({ content: 'Volume decreased!', ephemeral: true });

                case 'pause':
                    player.pause(true);
                    return interaction.reply({ content: 'Player paused.', ephemeral: true });

                case 'resume':
                    player.pause(false);
                    return interaction.reply({ content: 'Player resumed.', ephemeral: true });

                case 'skip':
                    player.stop();
                    return interaction.reply({ content: 'Skipped to the next track.', ephemeral: true });

                case 'stop': {
                    const channel = client.channels.cache.get(player.textChannel);
                    if (player.currentMessageId) {
                        try {
                            const finalMessage = await channel.messages.fetch(player.currentMessageId);
                            if (finalMessage) await finalMessage.delete();
                        } catch (deleteErr) {
                           
                            try {
                                const finalMessage = await channel.messages.fetch(player.currentMessageId);
                                if (finalMessage) {
                                    const disabledComponents = finalMessage.components.map(row =>
                                        new ActionRowBuilder().addComponents(
                                            row.components.map(component =>
                                                ButtonBuilder.from(component).setDisabled(true)
                                            )
                                        )
                                    );
                                    await finalMessage.edit({ components: disabledComponents });
                                }
                            } catch (editErr) {
                                console.error("Failed to disable buttons:", editErr);
                            }
                        }
                    }
                    player.destroy();
                    return interaction.reply({ content: 'Stopped the music and disconnected.', ephemeral: true });
                }

                case 'clear_queue':
                    player.queue.clear();
                    return interaction.reply({ content: 'Queue cleared.', ephemeral: true });

                case 'shuffle':
                    player.queue.shuffle();
                    return interaction.reply({ content: 'Queue shuffled!', ephemeral: true });

                case 'loop':

                    const loopMode = player.loop === 'none' ? 'track' : player.loop === 'track' ? 'queue' : 'none';
                    player.setLoop(loopMode);
                    return interaction.reply({ content: `Loop mode set to: **${loopMode}**.`, ephemeral: true });
                case 'show_queue':
                    if (!player.queue || player.queue.length === 0) {
                        return interaction.reply({ content: '❌ The queue is empty.', ephemeral: true });
                    }

                    const queueStr = player.queue
                        .map((track, i) => `${i + 1}. **${track.info.title}**`)
                        .join('\n');
                    return interaction.reply({ content: `🎶 **Queue:**\n${queueStr}`, ephemeral: true });

                default:
                    return;
            }
        });


        client.on('raw', d => client.riffy.updateVoiceState(d));
        client.once('ready', () => {
            //console.log('\x1b[35m[ MUSIC 2 ]\x1b[0m', '\x1b[32mLavalink Music System Active ✅\x1b[0m');
            client.riffy.init(client.user.id);
        });
    } else {
        console.log('\x1b[31m[ MUSIC ]\x1b[0m Lavalink Music System Disabled ❌');
    }
};
