const { EmbedBuilder } = require('discord.js');
const Pet = require('../../models/pets/pets');

// This should be the same in-memory store as in battle.js
const activeBattles = new Map();

const rarityMultipliers = {
    common: 1,
    rare: 1.2,
    epic: 1.5,
    legendary: 2,
};

module.exports = {
    name: 'move',
    description: 'Use a move in a pet battle.',
    async execute(message, args) {
        const userId = message.author.id;
        const battleId = [...activeBattles.keys()].find(key => key.includes(userId));

        if (!battleId) {
            return message.reply('You are not in a battle.');
        }

        const battle = activeBattles.get(battleId);

        if (battle.turn !== userId) {
            return message.reply('It is not your turn.');
        }

        const moveName = args.join(' ');
        const attacker = battle.challenger.id === userId ? battle.challenger : battle.opponent;
        const defender = battle.challenger.id === userId ? battle.opponent : battle.challenger;

        // For simplicity, we'll assume a basic 'attack' move
        // In a real implementation, you would check for the pet's actual abilities
        if (moveName.toLowerCase() !== 'attack') {
            return message.reply('You can only use the \"attack\" move for now.');
        }

        // Damage formula
        const damage = Math.floor(
            (attacker.pet.stats.attack - defender.pet.stats.defense) *
            rarityMultipliers[attacker.pet.rarity] *
            (Math.random() * (1.15 - 0.85) + 0.85) // Random factor
        );

        defender.pet.stats.hp -= damage;

        let battleLog = `${attacker.pet.name} attacks ${defender.pet.name} for ${damage} damage!\n`;

        if (defender.pet.stats.hp <= 0) {
            battleLog += `${defender.pet.name} has been defeated!\n`;
            battleLog += `${attacker.pet.name} wins the battle!`;

            // Update battle records
            await Pet.findByIdAndUpdate(attacker.pet._id, { $inc: { 'battleRecord.wins': 1 } });
            await Pet.findByIdAndUpdate(defender.pet._id, { $inc: { 'battleRecord.losses': 1 } });

            activeBattles.delete(battleId);

        } else {
            battleLog += `${defender.pet.name} has ${defender.pet.stats.hp} HP remaining.`;
            battle.turn = defender.id; // Switch turns
        }

        const embed = new EmbedBuilder()
            .setTitle('Battle Update')
            .setDescription(battleLog)
            .setColor('#FFA500');

        message.reply({ embeds: [embed] });
    },
};
