const { EmbedBuilder } = require('discord.js');
const Pet = require('../../models/pets/pets');
const rarityColors = require('../../utils/rarityColors');

/**
 * Formats a single ability object into a user-friendly string.
 * @param {object} ability - The ability object from the pet model.
 * @returns {string} - A formatted string describing the ability.
 */
const formatAbility = (ability) => {
    const typeEmoji = {
        attack: '⚔️',
        active: '💥',
        passive: '🛡️',
        care: '💖',
    };

    let description = `${typeEmoji[ability.type] || '✨'} **${ability.name}** (${ability.type})\n`;
    let effectDescription = 'Effect not specified.';

    if (ability.effect) {
        const effects = [];
        for (const [key, value] of Object.entries(ability.effect)) {
            switch (key) {
                case 'damage':
                    effects.push(`Deals ${value} damage.`);
                    break;
                case 'happiness':
                    effects.push(`Increases happiness by ${value}.`);
                    break;
                case 'defenseBoost':
                    effects.push(`Boosts defense by ${value} at the start of a battle.`);
                    break;
                case 'allyAttackUp':
                    effects.push(`Boosts attack by ${value} at the start of a battle.`);
                    break;
                case 'randomBuff':
                    effects.push(`Randomly boosts one of the following stats: ${value.join(', ')}.`);
                    break;
                default:
                    effects.push(`${key}: ${value}`);
            }
        }
        if (effects.length > 0) {
            effectDescription = effects.join(' ');
        }
    }

    return `${description}*${effectDescription}*`;
};

module.exports = {
    name: 'ability',
    description: "Displays detailed information about a pet's abilities.",
    async execute(message, args) {
        const petName = args[0];
        if (!petName) {
            return message.reply('Please specify a pet name. Usage: `$pet ability <pet-name>`');
        }

        const pet = await Pet.findOne({ ownerId: message.author.id, name: { $regex: new RegExp(`^${petName}$`, 'i') } });

        if (!pet) {
            return message.reply(`You do not own a pet named "${petName}".`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`✨ Abilities for ${pet.name} ✨`)
            .setColor(rarityColors[pet.rarity.toLowerCase()] || '#0099ff')
            .setThumbnail(pet.image || null);

        const hasStandardAbilities = pet.abilities && pet.abilities.length > 0;
        const hasSpecialAbilities = pet.specialAbilities && pet.specialAbilities.length > 0;

        if (hasStandardAbilities) {
            const regularAbilities = pet.abilities.map(formatAbility).join('\n\n');
            embed.addFields({ name: 'Standard Abilities', value: regularAbilities });
        }

        if (hasSpecialAbilities) {
            const specialAbilities = pet.specialAbilities.map(formatAbility).join('\n\n');
            embed.addFields({ name: '🌟 Special Abilities', value: specialAbilities });
        }

        if (!hasStandardAbilities && !hasSpecialAbilities) {
            embed.setDescription('This pet has not learned any abilities yet.');
        }

        message.reply({ embeds: [embed] });
    },
};
