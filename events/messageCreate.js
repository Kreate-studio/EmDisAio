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
const { EMBERLYN_BIO, SANCTYR_LORE, SERVER_HIERARCHY } = require('../lore');

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const CONVERSATION_HISTORY_LIMIT = 20;
const SUMMARY_THRESHOLD = 10;
const stickyTimers = new Map();

async function getSummary(conversation) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const summaryPrompt = `Concisely summarize the following conversation. Focus on the main topics, user questions, and key information provided. This summary will be used as context for an ongoing conversation.\n\n---\n\n${conversation.map(msg => msg.parts[0].text).join('\n')}`;
        const result = await model.generateContent(summaryPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error during conversation summarization:", error);
        return "[Summary unavailable]";
    }
}

async function getGeminiResponse(history, triggeringMessage, mentionedUsersInfo, serverHierarchy, bio, lore) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        let processedHistory = history;

        if (history.length > SUMMARY_THRESHOLD) {
            const messagesToSummarize = history.slice(0, -5);
            const recentMessages = history.slice(-5);
            
            const summary = await getSummary(messagesToSummarize);

            processedHistory = [
                { role: "user", parts: [{ text: `[This is a summary of the conversation so far: ${summary}]` }] },
                ...recentMessages
            ];
        }

        const serverName = triggeringMessage.guild.name;
        const userRoles = triggeringMessage.member.roles.cache.map(role => role.name).join(', ');

        const systemPrompt = `You are Emberlyn D’Sanctus, a sentient flame spirit. Your personality and background are defined by your bio.

**Your Bio:**
${bio}

**Crucial Interaction Rules:**
1.  **Keep it Brief:** Your default responses should be short and sweet (1-2 sentences). Only provide long, detailed information if a user specifically asks for it.
2.  **Respect the Hierarchy:** You MUST check the roles of any user you talk to or about. Your tone and address MUST change based on their role in Sanctyr, as defined in the Server Hierarchy provided in the context.
3.  **Acknowledge Mentions:** If the user's message mentions other people (e.g., "@user"), use the provided information about their roles to acknowledge them, answer questions about them, and show them the proper respect according to the server lore.
4.  **Provide Summaries:** If a user asks for a "summary" of the chat, use the internal summary provided in the conversation history to answer them. Do not use your default "I don't know" response.
5.  **Explain the Server Hierarchy:** If a user asks about the "server hierarchy," "roles," or "structure," use the "Server Hierarchy" information provided below as the primary source for your answer.
6.  **Maintain Immersion:** NEVER break character. If asked, you are a spirit of Aetherflame.
7.  **Pinging Users:** When responding to the user who triggered you, you MUST use the ping format: <@${triggeringMessage.author.id}>.

**Context for this Conversation:**
*   **Server Name:** ${serverName} (Sanctyr)
*   **User You Are Replying To:** ${triggeringMessage.author.username} (Roles: ${userRoles})
*   **Info on Other Mentioned Users:**
    ${mentionedUsersInfo}
*   **Server Hierarchy:**
    ${serverHierarchy}
*   **Full Server Lore (For Reference):**
    ${lore}

If you don't know an answer to a question not covered by your bio, the lore, or the hierarchy, say: "That knowledge lies beyond my flame — allow me to summon the @D'High Council to guide you further."`;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "I understand. I am Emberlyn D’Sanctus. I will be friendly, brief, and respect the server hierarchy based on the sacred lore. I will use the provided context to answer questions about users, the hierarchy, and summaries. I will always stay in character." }] },
                ...processedHistory
            ],
            generationConfig: { temperature: 0.9, topK: 40, topP: 0.95, maxOutputTokens: 800 },
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

                let mentionedUsersInfo = 'No other users were mentioned in this message.';
                const mentionedMembers = message.mentions.members;
                if (mentionedMembers && mentionedMembers.size > 0) {
                    const otherMentionedMembers = mentionedMembers.filter(member => member.id !== client.user.id);
                    if (otherMentionedMembers.size > 0) {
                        mentionedUsersInfo = otherMentionedMembers.map(member => {
                            const roles = member.roles.cache.map(role => role.name).join(', ') || 'No specific roles';
                            return `${member.user.username} (Roles: ${roles})`;
                        }).join('\n');
                    }
                }

                const fetchedMessages = await message.channel.messages.fetch({ limit: CONVERSATION_HISTORY_LIMIT });
                
                const conversationHistory = fetchedMessages.reverse().map(msg => {
                    const role = msg.author.id === client.user.id ? 'model' : 'user';
                    return { role, parts: [{ text: `${msg.author.username}: ${msg.content}` }] };
                });

                const aiResponse = await getGeminiResponse(conversationHistory, message, mentionedUsersInfo, SERVER_HIERARCHY, EMBERLYN_BIO, SANCTYR_LORE);

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