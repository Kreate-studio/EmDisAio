const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');
const rarityColors = require('../../utils/rarityColors');

module.exports = {
    name: 'rename',
    description: 'Renames one of your pets.',
    async execute(message, args) {
        const combinedArgs = args.join(' ');
        const [oldName, newName] = combinedArgs.split(',').map(name => name.trim());

        if (!oldName || !newName) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('Usage: `$pet rename <old name>, <new name>`');
            return message.reply({ embeds: [embed] });
        }

        const pet = await Pet.findOne({ ownerId: message.author.id, name: oldName });

        if (!pet) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`You don\'t own a pet named "${oldName}".`);
            return message.reply({ embeds: [embed] });
        }
        const oldPetName = pet.name;
        pet.name = newName;
        await pet.save();

        const embed = new EmbedBuilder()
            .setColor(rarityColors[pet.rarity.toLowerCase()] || rarityColors.common)
            .setDescription(`🏷️ Your pet **${oldPetName}** has been renamed to **${newName}**!`)

        message.reply({ embeds: [embed] });
    },
};