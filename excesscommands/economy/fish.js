const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile, updateWallet, updateCooldown, addToInventory } = require('../../models/economy');
const ms = require('ms');

const FISH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

const fishRewards = [
    { name: 'Trout', min: 15, max: 40, emoji: '🐟' },
    { name: 'Salmon', min: 40, max: 100, emoji: '🐠' },
    { name: 'Tuna', min: 70, max: 180, emoji: '🐡' },
    { name: 'Shark', min: 120, max: 300, emoji: '🦈' }
];

const itemFinds = [
    { id: 'lootbox_common', name: 'Common Lootbox', chance: 0.04, type: 'lootbox' },
    { id: 'old_boot', name: 'Old Boot', chance: 0.1, type: 'junk' }
];

module.exports = {
    name: 'fish',
    description: 'Go fishing to earn money and maybe find items.',
    async execute(message, args) {
        const userId = message.author.id;
        const profile = await getEconomyProfile(userId);

        const lastFish = profile.cooldowns.fish || 0;
        const timeSinceLastFish = Date.now() - lastFish;

        if (timeSinceLastFish < FISH_COOLDOWN) {
            const timeLeft = FISH_COOLDOWN - timeSinceLastFish;
            return message.reply(`The fish aren't biting. You can fish again in **${ms(timeLeft, { long: true })}**.`);
        }

        await updateCooldown(userId, 'fish', Date.now());

        const fishResult = fishRewards[Math.floor(Math.random() * fishRewards.length)];
        const earnings = Math.floor(Math.random() * (fishResult.max - fishResult.min + 1)) + fishResult.min;
        await updateWallet(userId, earnings);

        let itemMessage = '';
        const randomNumber = Math.random();
        let cumulativeChance = 0;

        for (const item of itemFinds) {
            cumulativeChance += item.chance;
            if (randomNumber < cumulativeChance) {
                if (item.type === 'junk') {
                    itemMessage = `\nAs you were reeling it in, you also snagged an **${item.name}**. It's worthless.`;
                } else {
                    await addToInventory(userId, {
                        id: item.id,
                        name: item.name,
                        type: item.type,
                        purchaseDate: new Date()
                    });
                    itemMessage = `\nYou also found a **${item.name}**!`;
                }
                break; // Stop after finding one item
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Successful Fishing Trip!')
            .setDescription(`You caught a ${fishResult.emoji} **${fishResult.name}**, selling it for **$${earnings}**.${itemMessage}`)
            .setColor('#3498DB');

        message.reply({ embeds: [embed] });
    },
};