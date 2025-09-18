const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');
let rarityColors;
try {
    rarityColors = require('../../config').rarityColors;
} catch (error) {
    // It's okay if the file or property doesn't exist.
}

if (!rarityColors || Object.keys(rarityColors).length === 0) {
    console.warn('Warning: `rarityColors` not found in `config.js` or is empty. Using default colors.');
    rarityColors = {
        common: '#FFFFFF',
        rare: '#00FF00',
        epic: '#9B30FF',
        legendary: '#FFD700',
        mythic: '#FF00FF',
        exclusive: '#FF4500'
    };
}

module.exports = {
    name: 'info',
    description: 'Get detailed information about one of your pets.',
    async execute(message, args) {
        const petName = args.join(' ');
        if (!petName) {
            return message.reply('Please specify the name of the pet you want to see.');
        }

        const pet = await Pet.findOne({ ownerId: message.author.id, name: petName });

        if (!pet) {
            return message.reply(`You don\'t own a pet named ${petName}.`);
        }

        const rarityColor = rarityColors[pet.rarity.toLowerCase()] || '#FFFFFF';

        const embed = new EmbedBuilder()
            .setTitle(`${pet.name} - Level ${pet.level}`)
            .setColor(rarityColor)
            .setImage(pet.image)
            .addFields(
                { name: 'Rarity', value: pet.rarity, inline: true },
                { name: 'Experience', value: `${pet.xp}/${pet.level * 100}`, inline: true },
                { name: 'Status', value: pet.isDead ? 'Defeated' : 'Ready', inline: true },
                { name: '\n❤️ Health', value: `${pet.stats.hp}/${pet.stats.maxHealth}`, inline: false },
                { name: '⚔️ Attack', value: `${pet.stats.attack}`, inline: true },
                { name: '🛡️ Defense', value: `${pet.stats.defense}`, inline: true },
                { name: '⚡ Speed', value: `${pet.stats.speed}`, inline: true },
                { name: '\n😊 Happiness', value: `${pet.stats.happiness}/100`, inline: true },
                { name: '🍖 Hunger', value: `${pet.stats.hunger}/100`, inline: true },
                { name: '⚡ Energy', value: `${pet.stats.energy}/100`, inline: true }
            )
            .setFooter({ text: `Owned by ${message.author.username}` });

        message.reply({ embeds: [embed] });
    },
};
