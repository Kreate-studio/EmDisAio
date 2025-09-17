const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Displays a list of all available economy commands.',
    execute(message) {
        const embed = new EmbedBuilder()
            .setTitle('💰 Economy Command Help')
            .setDescription('Here is a list of all available commands related to the economy. Use `$economy <command>` to run them.')
            .addFields(
                { name: '💰 Earning Currency', value: '`$beg`\n`$crime`\n`$daily`\n`$fish`\n`$heist`\n`$hunt`\n`$loot`\n`$rob`\n`$weekly`\n`$work`' },
                { name: '💸 Managing Finances', value: '`$bank`\n`$deposit`\n`$invest`\n`$loan`\n`$paybills`\n`$transfer`\n`$withdraw`' },
                { name: '🛍️ Shop & Items', value: '`$buy`\n`$buy-gold`\n`$inventory`\n`$sell`\n`$shop`\n`$use`' },
                { name: '🎲 Gambling', value: '`$gamble`\n`$roulette`\n`$slots`' },
                { name: '🏆 Social & Profile', value: '`$leaderboard`\n`$myhome`\n`$profile`\n`$trade`' }
            )
            .setColor('#E67E22');

        message.reply({ embeds: [embed] });
    },
};
