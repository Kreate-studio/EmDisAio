const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Displays a list of all available pet commands.',
    execute(message) {
        const embed = new EmbedBuilder()
            .setTitle('🐾 Pet Command Help')
            .setDescription('Here is a list of all available commands for managing your pets.')
            .setColor('#4E4EC8')
            .addFields(
                {
                    name: ' Pet Management',
                    value: '\`$pet list\` - View all of your pets.\n' +
                           '\`$pet info <pet_name>\` - Get detailed stats for a pet.\n' +
                           '\`$pet rename <pet_name> <new_name>\` - Rename one of your pets.\n' +
                           '\`$pet inventory\` - See your pet-related items (food, toys, eggs).',
                    inline: false
                },
                {
                    name: '🛒 Shop & Items',
                    value: '\`$pet shop\` - Browse pets, eggs, and supplies.\n' +
                           '\`$pet buy <item_id> [amount]\` - Purchase an item.\n' +
                           '\`$pet buyegg <egg_type>\` - Buy a new pet egg.\n' +
                           '\`$pet hatch <egg>\` - Hatch an egg from your inventory.',
                    inline: false
                },
                {
                    name: '❤️ Pet Care',
                    value: '\`$pet feed <pet_name>\` - Feed your pet to restore hunger.\n' +
                           '\`$pet play <pet_name>\` - Play with your pet to increase happiness.\n' +
                           '\`$pet heal <pet_name>\` - Heal your pet when it is injured.\n' +
                           '\`$pet rest <pet_name>\` - Allow your pet to rest and recover energy.',
                    inline: false
                },
                {
                    name: '⚔️ Battle & Training',
                    value: '\`$pet train <pet_name>\` - Train your pet to improve its stats.\n' +
                           '\`$pet adventure <pet_name>\` - Send your pet on an adventure.\n' +
                           '\`$pet evolve <pet_name>\` - Evolve your pet to a new form.\n' +
                           '\`$pet battle @user <your_pet_name>\` - Challenge another user to a battle.\n' +
                           '\`$pet battle move <ability_name>\` - Make a move in a battle.',
                    inline: false
                },
                {
                    name: '🎉 World Events',
                    value: '\`$pet event\` - View the current world event.\n' +
                           '\`$pet event join\` - Join the ongoing event.\n' +
                           '\`$pet event attack\` - Attack the event boss.',
                    inline: false
                }
            );

        message.channel.send({ embeds: [embed] });
    },
};
