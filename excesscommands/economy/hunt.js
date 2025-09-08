const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile, updateWallet, updateCooldown, addToInventory } = require('../../models/economy');
const { randomUUID } = require('crypto');
const ms = require('ms');

const HUNT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

const huntRewards = [
    { name: 'Rabbit', min: 20, max: 50, emoji: '🐰' },
    { name: 'Deer', min: 50, max: 120, emoji: '🦌' },
    { name: 'Boar', min: 80, max: 200, emoji: '🐗' },
    { name: 'Fox', min: 40, max: 100, emoji: '🦊' },
    { name: 'Bear', min: 150, max: 350, emoji: '🐻' } 
];

const itemFinds = [
    { id: 'lootbox_common', name: 'Common Lootbox', type: 'lootbox', chance: 0.05 }, // 5% chance
    { id: 'xp_boost', name: 'XP Boost', type: 'consumable', chance: 0.02 } // 2% chance
];

module.exports = {
    name: 'hunt',
    description: 'Hunt for animals to earn money and find items.',
    async execute(message, args) {
        const userId = message.author.id;
        const profile = await getEconomyProfile(userId);

        const lastHunt = profile.cooldowns.hunt || 0;
        const timeSinceLastHunt = Date.now() - lastHunt;

        if (timeSinceLastHunt < HUNT_COOLDOWN) {
            const timeLeft = HUNT_COOLDOWN - timeSinceLastHunt;
            return message.reply(`You need to rest. You can go hunting again in **${ms(timeLeft, { long: true })}**.`);
        }

        await updateCooldown(userId, 'hunt', Date.now());

        const huntResult = huntRewards[Math.floor(Math.random() * huntRewards.length)];
        const earnings = Math.floor(Math.random() * (huntResult.max - huntResult.min + 1)) + huntResult.min;

        let foundItem = null;
        const randomNumber = Math.random();
        let cumulativeChance = 0;

        for (const item of itemFinds) {
            cumulativeChance += item.chance;
            if (randomNumber < cumulativeChance) {
                foundItem = item;
                break;
            }
        }

        await updateWallet(userId, earnings);
        let itemMessage = '';

        if (foundItem) {
            await addToInventory(userId, {
                id: foundItem.id,
                name: foundItem.name,
                type: foundItem.type,
                purchaseDate: new Date(),
                uniqueId: randomUUID() // Add a unique ID for proper stacking
            });
            itemMessage = `\nIn your hunt, you also stumbled upon a **${foundItem.name}**!`;
        }

        const embed = new EmbedBuilder()
            .setTitle('Successful Hunt!')
            .setDescription(`You went hunting and caught a ${huntResult.emoji} **${huntResult.name}**, selling it for **$${earnings}**.${itemMessage}`)
            .setColor('#2ECC71');

        message.reply({ embeds: [embed] });
    },
};