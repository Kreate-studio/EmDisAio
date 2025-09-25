const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');

module.exports = {
    name: 'rename',
    description: 'Change the name of your pet.',
    aliases: ['name'],
    async execute(message, args) {
        const [petName, ...newNameParts] = args;
        const newName = newNameParts.join(' ');

        if (!petName || !newName) {
            return message.reply('Please provide the current name of your pet and its new name. Usage: `$pet rename <current-name> <new-name>`');
        }

        const pet = await Pet.findOne({ ownerId: message.author.id, name: { $regex: new RegExp(`^${petName}$`, 'i') } });

        if (!pet) {
            return message.reply(`You don\'t own a pet named \"${petName}\".`);
        }

        const oldName = pet.name;
        pet.name = newName;
        await pet.save();

        const embed = new EmbedBuilder()
            .setTitle('Pet Renamed!')
            .setDescription(`You have renamed **${oldName}** to **${newName}**.`)
            .setColor('#00FF00');

        message.reply({ embeds: [embed] });
    },
};