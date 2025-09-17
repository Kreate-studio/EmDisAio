const { EmbedBuilder } = require('discord.js');
const rarityColors = require('../../utils/rarityColors');

module.exports = {
    name: 'help',
    description: 'Displays a list of all available pet commands.',
    execute(message) {
        const embed = new EmbedBuilder()
            .setTitle('🐾 Pet Command Help')
            .setDescription('Here is a list of all available commands:')
            .addFields(
                { name: '📖 General', value: '`$pet help`\n`$pet info <pet>`\n`$pet inventory`\n`$pet rename <pet> <newName>`' },
                { name: '💰 Shop & Eggs', value: '`$pet shop`\n`$pet buy egg <type>`\n`$pet hatch <egg>`' },
                { name: '❤️ Care', value: '`$pet feed <pet>`\n`$pet play <pet>`\n`$pet heal <pet>`\n`$pet rest <pet>`' },
                { name: '💪 Training & Progression', value: '`$pet train <pet>`\n`$pet adventure <pet>`\n`$pet evolve <pet>`' },
                { name: '⚔️ Battles', value: '`$pet battle <user>`\n`$pet move <ability>`' },
                { name: '🎉 Events', value: '`$pet event`\n`$pet event join`\n`$pet event attack`' },
                { name: '🤝 Social', value: '`$pet gift <user> <item>`\n`$pet trade <user>`' }
            )
            .setColor(rarityColors.common);

        message.reply({ embeds: [embed] });
    },
};
