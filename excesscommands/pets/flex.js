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
    name: 'flex',
    description: 'Show off your best pet!',
    async execute(message) {
        const userId = message.author.id;
        const userPets = await Pet.find({ ownerId: userId });

        if (userPets.length === 0) {
            return message.reply("You don't have any pets to show off yet!");
        }

        const sortedPets = userPets.sort((a, b) => {
            const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Exclusive'];
            const rarityA = rarityOrder.indexOf(a.rarity);
            const rarityB = rarityOrder.indexOf(b.rarity);

            if (rarityB !== rarityA) return rarityB - rarityA;
            if (b.level !== a.level) return b.level - a.level;

            const totalStatsA = a.stats.attack + a.stats.defense + a.stats.speed;
            const totalStatsB = b.stats.attack + b.stats.defense + b.stats.speed;
            return totalStatsB - totalStatsA;
        });

        const pet = sortedPets[0];
        const rarityColor = rarityColors[pet.rarity.toLowerCase()] || '#FFFFFF';

        const embed = new EmbedBuilder()
            .setTitle(`${pet.name} - Level ${pet.level}`)
            .setColor(rarityColor)
            .setImage(pet.image)
            .addFields(
                { name: 'Rarity', value: pet.rarity, inline: true },
                { name: 'Attack', value: `${pet.stats.attack}`.toString(), inline: true },
                { name: 'Defense', value: `${pet.stats.defense}`.toString(), inline: true },
                { name: 'Speed', value: `${pet.stats.speed}`.toString(), inline: true },
                { name: 'Status', value: pet.isDead ? 'Defeated' : 'Ready', inline: true }
            )
            .setFooter({ text: `Owned by ${message.author.username}` });

        message.reply({ embeds: [embed] });
    },
};
