const { EmbedBuilder } = require('discord.js');
const Pet = require('../../models/pets/pets');
const rarityColors = require('../../utils/rarityColors');

module.exports = {
    name: 'info',
    description: 'Displays information about a specific pet.',
    async execute(message, args) {
        const petName = args[0];

        if (!petName) {
            return message.reply('You need to specify a pet name.');
        }

        const pet = await Pet.findOne({ ownerId: message.author.id, name: petName });

        if (!pet) {
            return message.reply(`You don\'t own a pet named "${petName}".`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`Pet Info: ${pet.name}`)
            .setColor(rarityColors[pet.rarity.toLowerCase()])
            .addFields(
                { name: 'Species', value: pet.species, inline: true },
                { name: 'Rarity', value: pet.rarity, inline: true },
                { name: 'Level', value: `Lvl ${pet.level} (${pet.xp} XP)` },
                { name: '❤️ HP', value: `${pet.stats.hp}`, inline: true },
                { name: '⚔️ Attack', value: `${pet.stats.attack}`, inline: true },
                { name: '🛡️ Defense', value: `${pet.stats.defense}`, inline: true },
                { name: '💨 Speed', value: `${pet.stats.speed}`, inline: true },
                { name: '🍖 Hunger', value: `${pet.stats.hunger}%`, inline: true },
                { name: '😊 Happiness', value: `${pet.stats.happiness}%`, inline: true },
                { name: '⚡ Energy', value: `${pet.stats.energy}%`, inline: true },
                { name: '⌛ Age', value: `${pet.ageHours} hours`, inline: true },
                { name: 'Status', value: pet.isDead ? '💀 Dead' : '💖 Alive', inline: true },
            );

        if (pet.abilities.length > 0) {
            embed.addFields({ name: '✨ Abilities', value: pet.abilities.join(', ') });
        }

        message.reply({ embeds: [embed] });
    },
};
