const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile, updateWallet, updateXP, updateCooldown } = require('../../models/economy');

const jobs = [
    // ... [rest of the jobs array is unchanged] ...
    { name: 'Lumberjack', min: 50, max: 100, baseXp: 8 },
    { name: 'Programmer', min: 150, max: 300, baseXp: 25 },
    { name: 'Chef', min: 100, max: 200, baseXp: 15 },
    { name: 'Delivery Person', min: 70, max: 150, baseXp: 11 },
    { name: 'Engineer', min: 200, max: 400, baseXp: 30 },
    { name: 'Construction Worker', min: 90, max: 160, baseXp: 13 },
    { name: 'Janitor', min: 60, max: 120, baseXp: 9 },
    { name: 'Electrician', min: 120, max: 250, baseXp: 18 },
    { name: 'Mechanic', min: 110, max: 200, baseXp: 16 },
    { name: 'Data Analyst', min: 180, max: 350, baseXp: 26 },
    { name: 'Marketing Manager', min: 200, max: 400, baseXp: 30 },
    { name: 'Accountant', min: 170, max: 320, baseXp: 24 },
    { name: 'Teacher', min: 100, max: 220, baseXp: 16 },
    { name: 'Graphic Designer', min: 120, max: 250, baseXp: 18 },
    { name: 'Writer', min: 100, max: 200, baseXp: 15 },
    { name: 'Musician', min: 90, max: 180, baseXp: 14 },
    { name: 'Photographer', min: 80, max: 170, baseXp: 12 },
    { name: 'Biologist', min: 200, max: 380, baseXp: 29 },
    { name: 'AI Researcher', min: 300, max: 500, baseXp: 40 },
    { name: 'Game Developer', min: 180, max: 350, baseXp: 27 },
    { name: 'Police Officer', min: 130, max: 250, baseXp: 19 },
    { name: 'Firefighter', min: 120, max: 240, baseXp: 18 },
    { name: 'Paramedic', min: 140, max: 260, baseXp: 20 },
    { name: 'Stock Trader', min: 100, max: 600, baseXp: 35 },
    { name: 'Crypto Miner', min: 50, max: 700, baseXp: 37 },
    { name: 'Black Market Courier', min: 200, max: 1000, baseXp: 60 },
];

module.exports = {
    name: 'work',
    description: 'Work a job to earn money and experience.',
    async execute(message) {
        const userId = message.author.id;
        const profile = await getEconomyProfile(userId);
        const now = Date.now();

        // --- Cooldown Logic ---
        let cooldown = 1 * 60 * 60 * 1000; // 1 hour default
        const energyDrink = profile.activeEffects?.find(e => e.name === 'Energy Drink' && e.expiresAt > now);
        if (energyDrink) {
            cooldown /= 2; // Halve the cooldown
        }

        if (profile.cooldowns && profile.cooldowns.work && now - profile.cooldowns.work < cooldown) {
            const remaining = (profile.cooldowns.work + cooldown) - now;
            const remainingMinutes = Math.ceil(remaining / (60 * 1000));
            return message.reply(`You are on cooldown. Please try again in ${remainingMinutes} minute(s).`);
        }

        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const earnings = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

        // --- XP Logic ---
        let xpGained = job.baseXp;
        const xpBoost = profile.activeEffects?.find(e => e.name === 'XP Boost' && e.expiresAt > now);
        if (xpBoost) {
            xpGained *= 2;
        }

        // **CORRECTED DATABASE OPERATIONS**
        // Use dedicated functions to avoid the MongoServerError
        await updateWallet(userId, earnings);
        await updateXP(userId, xpGained);
        await updateCooldown(userId, 'work', now);

        const embed = new EmbedBuilder()
            .setTitle('💼 Work Complete 💼')
            .setDescription(`You worked as a **${job.name}** and earned **$${earnings.toLocaleString()}** and **${xpGained} XP**!`)
            .setColor('#2ECC71');

        let footerText = [];
        if (energyDrink) {
            footerText.push('Your Energy Drink reduced the cooldown!');
        }
        if (xpBoost) {
            footerText.push('Your XP Boost doubled your XP gain!');
        }
        if (footerText.length > 0) {
            embed.setFooter({ text: footerText.join(' ') });
        }

        message.reply({ embeds: [embed] });
    },
};
