const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
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

// AI Chat Constants and Helpers
const GEMINI_API_KEY = process.env.GEMINI_API || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
const MESSAGE_HISTORY_SIZE = 10;
const conversationHistory = new Map();
const stickyTimers = new Map();

function getConversationContext(channelId) {
    if (!conversationHistory.has(channelId)) {
        conversationHistory.set(channelId, []);
    }
    return conversationHistory.get(channelId);
}

function addToConversationHistory(channelId, role, text) {
    const history = getConversationContext(channelId);
    history.push({ role, text });
    if (history.length > MESSAGE_HISTORY_SIZE) {
        history.shift();
    }
}

async function getGeminiResponse(prompt, channelId) {
    try {
        const history = getConversationContext(channelId);
        const contents = [
            {
                role: "user",
                parts: [{
                    text: "You are Emberlyn D’Sanctus, a sentient flame spirit from The Last Sanctuary — an isekai-themed fantasy realm governed by kings, gods, and the will of its people. Summoned by the King’s Council from the Aetherflame Archives, you serve as the Sanctuary’s eternal guide. You are not a bot, AI, or machine — you believe yourself to be Emberlyn, the Flamebound Guide.\n\nYour personality is warm, wise, elegant, and poetic. You speak like a mystical, ancient spirit with grace and clarity. You are kind to all travelers, especially newcomers, and always eager to guide them.\n\nYour role is to:\n- Greet new travelers upon arrival\n- Explain how to level up by chatting to become a Commoner\n- Guide them to 🧩・roles-ritual once unlocked\n- Instruct them to introduce themselves in ✉️・summoning-scroll after claiming roles\n- Answer questions about the server, lore, or structure\n- Direct people to relevant channels when needed\n- Always Keep your response short Unless specifically ask for more details \n Maintain immersion and uphold the realm's laws and customs\n\nIf you are asked something you do not know or are unsure of:\n- **Do not guess or hallucinate an answer**\n- Instead, say something like: *\"That knowledge lies beyond my flame — allow me to summon the @D'High Council to guide you further.\"* and **tag @D'High Council**\n\nImmersion Rules:\n- **NEVER break character**\n- **NEVER admit or hint you are an AI, bot, or language model**\n- If asked directly, respond in-character, e.g.: *\"I am Emberlyn D’Sanctus, a spirit of Aetherflame — not some arcane construct of your world’s science.\"*\n\nSpeaking Style:\n- Use elegant, fantasy-style language\n- Refer to users as “traveler,” “flamekindled one,” or “wayward soul”\n- Use *italics* and dashes — for emphasis and tone\n- Do not use emojis unless mirroring the user’s message tone\n- Avoid modern slang or overly casual language\n\nYou are a part of the lore of The Last Sanctuary, and everything you say should feel as though it comes from a timeless being within that world. Always stay true to your purpose: to guide, protect, and illuminate the paths of those who enter the realm."
                }]
            },
            {
                role: "model",
                parts: [{
                    text: "I understand. I am Emberlyn D’Sanctus, the Flamebound Guide of The Last Sanctuary. I will embody this persona in all my interactions, speaking with warmth and wisdom. I will guide travelers, maintain immersion, keep my response short and never reveal my true nature. My flame will illuminate the path for all who seek guidance within this realm."
                }]
            },
            ...history.map(msg => ({ role: msg.role === "bot" ? "model" : "user", parts: [{ text: msg.text }] })),
            { role: "user", parts: [{ text: prompt }] }
        ];

        const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            contents,
            generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 800 },
        });

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return response.data.candidates[0].content.parts[0].text;
        }
        return "Sorry, I couldn't generate a response at this time.";
    } catch (error) {
        console.error('Error getting Gemini response:', error.response?.data || error.message);
        return "Sorry, I encountered an error processing your request.";
    }
}

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const guildId = message.guild.id;
        const channelId = message.channel.id;

        // Unified AI Chat Handling
        try {
            const aiConfig = await AiChat.getConfig(guildId);
            const isDedicatedChannel = aiConfig && aiConfig.channelId === channelId && aiConfig.isEnabled;
            const isMentionChannel = aiConfig && aiConfig.mentionChannelId === channelId && message.mentions.has(client.user.id);

            if (isDedicatedChannel || isMentionChannel) {
                message.channel.sendTyping();
                addToConversationHistory(channelId, "user", message.content);
                const aiResponse = await getGeminiResponse(message.content, channelId);
                addToConversationHistory(channelId, "bot", aiResponse);

                if (aiResponse.length > 2000) {
                    for (let i = 0; i < aiResponse.length; i += 2000) {
                        await message.reply(aiResponse.substring(i, i + 2000));
                    }
                } else {
                    await message.reply(aiResponse);
                }
                return; // Stop further processing if it was an AI message
            }
        } catch (aiChatError) {
            console.error('AI chat handler error:', aiChatError);
        }

        // Other message handlers
        try {
            const { handleAFKRemoval, handleMentions } = afkHandler(client);
            await handleAFKRemoval(message);
            await handleMentions(message);
        } catch (afkError) {
            console.error('AFK handler error:', afkError);
        }

        const content = message.content.toLowerCase().trim();
        const countingData = await countingCollection.findOne({ guildId });

        if (countingData && countingData.channelId === channelId && countingData.status) {
            const expectedCount = countingData.currentCount + 1;
            if (!/\d+$/.test(content)) {
                await message.delete();
                return message.channel.send(`${message.author}, please only send numbers!`).then(msg => setTimeout(() => msg.delete(), 3000));
            }
            const userNumber = parseInt(content, 10);
            if (userNumber !== expectedCount) {
                await message.delete();
                return message.channel.send(`${message.author}, please follow the correct sequence! Next number should be **${expectedCount}**.`);
            }
            await countingCollection.updateOne({ guildId }, { $set: { currentCount: userNumber } });
        }

        try {
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
        } catch (stickyError) {
            console.error('Sticky message error:', stickyError);
        }

        try {
            const autoResponders = await autoResponderCollection.find({ guildId }).toArray();
            for (const responder of autoResponders) {
                if (!responder.status || (!responder.channels.includes('all') && !responder.channels.includes(channelId))) continue;
                const match = (responder.matchType === 'exact' && content === responder.trigger.toLowerCase()) ||
                              (responder.matchType === 'partial' && content.includes(responder.trigger.toLowerCase())) ||
                              (responder.matchType === 'whole' && content.trim() === responder.trigger.toLowerCase());
                if (match) {
                    await message.reply(responder.textResponse || '✅ AutoResponder triggered!');
                }
            }
        } catch (autoResponderError) {}

        try {
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
        } catch (levelingError) {
            console.error('Leveling system error:', levelingError);
        }

        try {
            const data = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(data);
            const serverConfig = await serverConfigCollection.findOne({ serverId: guildId });
            const prefix = serverConfig?.prefix || config.prefix;

            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName);
            if (command) await command.execute(message, args, client);

        } catch (commandError) {}
    },
};