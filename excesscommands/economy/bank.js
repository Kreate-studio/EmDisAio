const { getEconomyProfile } = require('../../models/economy');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'bank',
    description: 'Check your bank balance.',
    async execute(message) {
        const userId = message.author.id;
        const profile = await getEconomyProfile(userId);

        const wallet = Number(profile.wallet ?? 1);
        const bank = Number(profile.bank ?? 0);

        const embed = new EmbedBuilder()
            .setTitle('Bank Balance')
            .setDescription(`**Wallet:** $${wallet}\n**Bank:** $${bank}`)
            .setColor('#FF00FF')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};