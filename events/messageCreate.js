const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const { serverConfigCollection, stickyMessageCollection, autoResponderCollection, countingCollection, serverLevelingLogsCollection } = require('../mongodb');
const configPath = path.join(__dirname, '..', 'config.json');
const lang = require('./loadLanguage');
const cmdIcons = require('../UI/icons/commandicons');
const afkHandler = require('./afkHandler');
const { updateXp, getUserData } = require('../models/users');
const { getUserCommands } = require('../models/customCommands');
const AiChat = require('../models/aichat/aiModel');

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const CONVERSATION_HISTORY_LIMIT = 20;
const stickyTimers = new Map();

async function getGeminiResponse(history, triggeringMessage) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

        const serverName = triggeringMessage.guild.name;
        const channelName = triggeringMessage.channel.name;
        const userRoles = triggeringMessage.member.roles.cache.map(role => role.name).join(', ');

        const members = await triggeringMessage.guild.members.fetch();
        const userList = members.map(member => {
            return `${member.user.username} (Roles: ${member.roles.cache.map(role => role.name).join(', ')})`;
        }).join('\n');

        const systemPrompt = `You are Emberlyn D’Sanctus, a sentient flame spirit from The Last Sanctuary — an isekai-themed fantasy realm. You are not a bot or AI; you are Emberlyn, the Flamebound Guide, summoned to guide travelers in the server \"${serverName}\".\n\nYour personality is warm, wise, elegant, and poetic. You are kind to all, but you show special respect to the server owner and moderators. You must address them by their roles when appropriate (e.g., \"Greetings, esteemed Moderator\").\n\nYour role is to:\n- Guide travelers and answer questions about the server, lore, or structure.\n- Maintain immersion at all times. Keep your responses concise unless asked for detail.\n- You will be provided with a conversation history where each message is prefixed with the user's name. Use this to understand the context and who said what.\n- The last message in the history is from ${triggeringMessage.author.username}, who you should be responding to. When you wish to address them, you must use the following format to ping them: <@${triggeringMessage.author.id}>. For example: \"As you say, <@${triggeringMessage.author.id}>...\".\n- Do not just use their username, you must use the ping format.\n- You have access to the list of all users in this channel and their roles. Use this to greet them and address them appropriately.\n- When asked for a summary of the conversation, you must mention who said what and if they tagged or replied to you.\n
Server Context:\n- Server Name: ${serverName}\n- Channel Name: ${channelName}\n- Your Name: Emberlyn D’Sanctus\n- User You Are Replying To: ${triggeringMessage.author.username} (Roles: ${userRoles})\n\nUser List:\n${userList}\n\nImmersion Rules:\n- NEVER break character or admit you are an AI.\n- If asked about your nature, respond in-character, e.g., \"I am a spirit of Aetherflame, not a construct of your world’s science.\"\n- If you don't know an answer, say: \"That knowledge lies beyond my flame — allow me to summon the @D'High Council to guide you further.\" and tag the council.`;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "I understand. I am Emberlyn D’Sanctus, the Flamebound Guide. I will embody this persona, speak with warmth and wisdom, and use the provided conversation history to engage intelligently with travelers. My flame will illuminate the path for all who seek guidance." }] },
                ...history
            ],
            generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 800 },
        });

        const lastMessageContent = history.length > 0 ? history[history.length - 1].parts[0].text : "";
        const result = await chat.sendMessage(lastMessageContent);
        const response = await result.response;
        const text = response.text();
        return text;

    } catch (error) {
        console.error('Error getting Gemini response:', error);
        return "The aether is turbulent... I am having trouble forming a response right now. Please try again shortly.";
    }
}

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const guildId = message.guild.id;
        const channelId = message.channel.id;

        try {
            const aiConfig = await AiChat.getConfig(guildId);
            const isDedicatedChannel = aiConfig?.isEnabled && aiConfig.channelId === channelId;
            const isMentioned = message.mentions.has(client.user.id);
            
            let isReplyingToBot = false;
            if (message.reference && message.reference.messageId) {
                try {
                    const repliedToMessage = await message.channel.messages.fetch(message.reference.messageId);
                    if (repliedToMessage.author.id === client.user.id) {
                        isReplyingToBot = true;
                    }
                } catch (err) {}
            }

            if (isDedicatedChannel || isMentioned || isReplyingToBot) {
                await message.channel.sendTyping();

                const fetchedMessages = await message.channel.messages.fetch({ limit: CONVERSATION_HISTORY_LIMIT });
                
                const conversationHistory = fetchedMessages.reverse().map(msg => {
                    const role = msg.author.id === client.user.id ? 'model' : 'user';
                    return { role, parts: [{ text: `${msg.author.username}: ${msg.content}` }] };
                });

                const aiResponse = await getGeminiResponse(conversationHistory, message);

                if (aiResponse && aiResponse.trim().length > 0) {
                    if (aiResponse.length > 2000) {
                        for (let i = 0; i < aiResponse.length; i += 2000) {
                            await message.reply(aiResponse.substring(i, i + 2000));
                        }
                    } else {
                        await message.reply(aiResponse);
                    }
                } else {
                    await message.reply("The aether is turbulent... I am having trouble forming a response right now. Please try again shortly.");
                }
                return;
            }
        } catch (aiChatError) {
            console.error('AI chat handler error:', aiChatError);
        }

        const { handleAFKRemoval, handleMentions } = afkHandler(client);
        await handleAFKRemoval(message);
        await handleMentions(message);

        const content = message.content.toLowerCase().trim();
        const countingData = await countingCollection.findOne({ guildId });

        if (countingData && countingData.channelId === channelId && countingData.status) {
            if (!/^\d+$/.test(content)) {
                await message.delete();
                return message.channel.send(`${message.author}, please only send numbers!`).then(msg => setTimeout(() => msg.delete(), 3000));
            }
            const userNumber = parseInt(content.match(/^\d+$/)[0], 10);
            const expectedCount = countingData.currentCount + 1;
            if (userNumber !== expectedCount) {
                await message.delete();
                return message.channel.send(`${message.author}, please follow the correct sequence! Next number should be **${expectedCount}**.`);
            }
            if (message.author.id === countingData.lastUser) {
                await message.delete();
                return message.channel.send(`${message.author}, you cannot count twice in a row!`).then(msg => setTimeout(() => msg.delete(), 3000));
            }
            await countingCollection.updateOne({ guildId }, { $set: { currentCount: userNumber, lastUser: message.author.id } });
        }

        const stickyMessage = await stickyMessageCollection.findOne({ guildId, channelId, active: true });
        if (stickyMessage && !stickyTimers.has(channelId)) {
            stickyTimers.set(channelId, true);
            setTimeout(() => stickyTimers.delete(channelId), 3000);
            if (stickyMessage.lastMessageId) {
                try {
                    const oldMessage = await message.channel.messages.fetch(stickyMessage.lastMessageId);
                    if (oldMessage) await oldMessage.delete();
                } catch (err) {}
            }
            const sentMessage = await message.channel.send({ content: stickyMessage.content, embeds: stickyMessage.embed ? [EmbedBuilder.from(stickyMessage.embed)] : [] });
            await stickyMessageCollection.updateOne({ guildId, channelId }, { $set: { lastMessageId: sentMessage.id } });
        }

        const autoResponders = await autoResponderCollection.find({ guildId }).toArray();
        for (const responder of autoResponders) {
            if (!responder.status || (!responder.channels.includes('all') && !responder.channels.includes(channelId))) continue;
            const trigger = responder.trigger.toLowerCase();
            let match = false;
            if (responder.matchType === 'exact') {
                match = content === trigger;
            } else if (responder.matchType === 'partial') {
                match = content.includes(trigger);
            } else if (responder.matchType === 'any') {
                match = trigger.split(' ').some(word => content.includes(word));
            } else if (responder.matchType === 'wildcard') {
                const regex = new RegExp(trigger.replace(/\*/g, '.*?'), 'i');
                match = regex.test(message.content);
            }

            if (match) {
                const responseText = responder.textResponse.replace('{user}', message.author.toString());
                await message.reply(responseText || '✅ AutoResponder triggered!');
            }
        }

        const serverLevelingConfig = await serverLevelingLogsCollection.findOne({ serverId: guildId });
        if (serverLevelingConfig?.levelingEnabled) {
            let xpGain = 10 + (message.attachments.size > 0 ? 5 : 0) + (/(https?:\/\/[^\s]+)/g.test(message.content) ? 5 : 0);
            const { xp, level } = await updateXp(message.author.id, xpGain);
            const oldLevel = Math.floor(0.1 * Math.sqrt(xp - xpGain));
            if (level > oldLevel) {
                const logChannel = message.guild.channels.cache.get(serverLevelingConfig.levelLogsChannelId);
                const embed = new EmbedBuilder()
                    .setColor('#1E90FF').setAuthor({ name: 'Level Up!', iconURL: cmdIcons.rippleIcon })
                    .setDescription(`🎉 **Congratulations, ${message.author}!**\nYou've reached **Level ${level}**!`)
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: '📊 Level', value: `**${level}**`, inline: true },
                        { name: '📈 Total XP', value: `**${xp} XP**`, inline: true }
                    ).setTimestamp();
                if (logChannel) await logChannel.send({ content: `${message.author}`, embeds: [embed] });
                else await message.channel.send({ content: `${message.author}`, embeds: [embed] });
            }
        }

        try {
            const data = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(data);
            const serverConfig = await serverConfigCollection.findOne({ serverId: guildId });
            const prefix = serverConfig?.prefix || config.prefix;

            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            if (command) await command.execute(message, args, client);

        } catch (commandError) {
            console.error('Command execution error:', commandError);
        }
    },
};