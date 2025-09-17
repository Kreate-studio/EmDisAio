const { EmbedBuilder } = require('discord.js');
const Pet = require('../../models/pets/pets');
const rarityColors = require('../../utils/rarityColors');

const getStatBar = (value, max, symbol) => {
    const percentage = (value / max) * 100;
    const filledCount = Math.round((percentage / 100) * 10);
    const emptyCount = 10 - filledCount;
    return `${symbol.repeat(filledCount)}${ '-'.repeat(emptyCount)} [${value}/${max}]`;
};


module.exports = {
    name: 'info',
    description: 'Displays detailed information about one of your pets.',
    async execute(message, args) {
        const petName = args[0];
        if (!petName) {
            return message.reply('Please specify a pet name. Usage: `$pet info <pet-name>`');
        }

        const pet = await Pet.findOne({ ownerId: message.author.id, name: { $regex: new RegExp(`^${petName}$`, 'i') } });

        if (!pet) {
            return message.reply(`You do not own a pet named "${petName}".`);
        }

        const embed = new EmbedBuilder()
            .setColor(rarityColors[pet.rarity.toLowerCase()] || '#FFFFFF')
            .setTitle(`🐾 ${pet.name} - The ${pet.species} 🐾`)
            .setThumbnail(pet.image || 'https://i.imgur.com/a/J4j4j4j.png') // Add a default image
            .addFields(
                { name: '🌟 Rarity', value: pet.rarity, inline: true },
                { name: '📈 Level', value: `Lvl ${pet.level}`, inline: true },
                { name: '✨ XP', value: `${pet.xp} / ${100 * pet.level ** 2}`, inline: true },
                { name: '\n📊 Stats', value: '──────────' },
                { name: '❤️ HP', value: getStatBar(pet.stats.hp, 100, '❤️'), inline: false },
                { name: '⚔️ Attack', value: String(pet.stats.attack), inline: true },
                { name: '🛡️ Defense', value: String(pet.stats.defense), inline: true },
                { name: '💨 Speed', value: String(pet.stats.speed), inline: true },
                { name: '\n💖 Well-being', value: '──────────' },
                { name: '🍖 Hunger', value: getStatBar(pet.stats.hunger, 100, '🍖'), inline: false },
                { name: '😊 Happiness', value: getStatBar(pet.stats.happiness, 100, '😊'), inline: false },
                { name: '⚡ Energy', value: getStatBar(pet.stats.energy, 100, '⚡'), inline: false },
                { name: '\n📋 Other Info', value: '──────────' },
                { name: '⌛ Age', value: `${pet.ageHours} hours`, inline: true },
                { name: '🏆 Wins', value: `${pet.battleRecord.wins}`, inline: true },
                { name: '💀 Status', value: pet.isDead ? 'Defeated' : 'Ready', inline: true }
            );

        if (pet.abilities && pet.abilities.length > 0) {
            const abilityNames = pet.abilities.map(a => a.name).join(', ');
            embed.addFields({ name: '💥 Abilities', value: abilityNames });
        }

        if (pet.specialAbilities && pet.specialAbilities.length > 0) {
            const specialAbilityText = pet.specialAbilities.map(sa => `**${sa.name}** (${sa.type})`).join('\n');
            embed.addFields({ name: '✨ Special Abilities', value: specialAbilityText });
        }
        
        embed.setFooter({ text: `ID: ${pet.petId} | Created: ${pet.createdAt.toDateString()}` });

        message.reply({ embeds: [embed] });
    },
};
