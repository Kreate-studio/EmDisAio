const { EmbedBuilder } = require('discord.js');
const { getAllEconomyProfiles } = require('../../models/economy');

module.exports = {
    name: 'leaderboard',
    description: 'Displays the top 10 richest users.',
    aliases: ['lb', 'top'],
    async execute(message, args) {
        try {
            const allProfiles = await getAllEconomyProfiles();

            // Sort by bank balance in descending order
            const sortedProfiles = allProfiles.sort((a, b) => b.bank - a.bank);

            // Get top 10
            const top10 = sortedProfiles.slice(0, 10);

            const embed = new EmbedBuilder()
                .setTitle('Top 10 Richest Users')
                .setColor('#FFD700'); // Gold color

            if (top10.length === 0) {
                embed.setDescription('There are no users to display on the leaderboard yet.');
            } else {
                let leaderboardString = '';
                for (let i = 0; i < top10.length; i++) {
                    const profile = top10[i];
                    const user = await message.client.users.fetch(profile.userId).catch(() => null);
                    const username = user ? user.username : `User ${i + 1}`;
                    leaderboardString += `${i + 1}. **${username}** - $${profile.bank.toLocaleString()}\n`;
                }
                embed.setDescription(leaderboardString);
            }

            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            message.reply('An error occurred while fetching the leaderboard.');
        }
    },
};