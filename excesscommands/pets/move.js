const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');
const GuildSettings = require('../../models/guild/guildSettings'); // Corrected Path
const { activeBattles } = require('./battleState');
const { resolveAttack } = require('../../utils/battleUtils');

// Embedded rarityColors object
const rarityColors = {
    common: '#BFC9CA',
    rare: '#5DADE2',
    epic: '#AF7AC5',
    legendary: '#F4D03F',
    mythic: '#E74C3C',
    exclusive: '#F39C12'
};

// Function to apply status effects at the start of a turn
const applyStatusEffects = (pet) => {
    const messages = [];
    let damageFromEffects = 0;

    pet.statusEffects = pet.statusEffects.filter(effect => {
        if (effect.type === 'poison') {
            const poisonDamage = Math.round(pet.stats.maxHealth * 0.05); // 5% of max health
            damageFromEffects += poisonDamage;
            messages.push(`${pet.name} takes ${poisonDamage} damage from poison.`);
        }
        
        effect.turns -= 1;
        return effect.turns > 0;
    });

    return { damageFromEffects, messages };
};


module.exports = {
    name: 'move',
    description: 'Makes a move in an ongoing battle.',
    async execute(message, args) {
        const battle = [...activeBattles.values()].find(b => b.participants.has(message.author.id));

        if (!battle) {
            return message.reply('You are not currently in a battle.');
        }

        const guildSettings = await GuildSettings.findOne({ guildId: message.guild.id });
        const battleChannelId = guildSettings ? guildSettings.battleChannelId : null;

        if (battleChannelId && message.channel.id !== battleChannelId) {
            return message.reply(`Battles can only take place in <#${battleChannelId}>.`);
        }

        if (battle.turn !== message.author.id) {
            return message.reply('It is not your turn!');
        }
        const moveName = args.join(' ');
        if (!moveName) {
            return message.reply('Usage: `$pet move <ability name>`');
        }
        const player = battle.participants.get(message.author.id);
        const opponentId = [...battle.participants.keys()].find(id => id !== message.author.id);
        const opponent = battle.participants.get(opponentId);

        // Apply status effects to the current player
        const { damageFromEffects, messages: effectMessages } = applyStatusEffects(player.pet);
        player.pet.stats.hp -= damageFromEffects;

        if (effectMessages.length > 0) {
            await message.channel.send(effectMessages.join('\n'));
        }
        
        if (player.pet.stats.hp <= 0) {
          // Handle player defeat due to status effects
          // (This logic will be similar to the end-of-battle logic)
          return; 
        }

        const ability =
            [...(player.pet.abilities || []), ...(player.pet.specialAbilities || [])]
                .find(a => a.name.toLowerCase() === moveName.toLowerCase() && ['attack', 'active'].includes(a.type));

        if (!ability) {
            return message.reply(`'${moveName}' is not a valid battle move.`);
        }
        
        const { newDefenderHealth, message: attackMessage } = resolveAttack(player.pet, opponent.pet, ability);
        opponent.pet.stats.hp = newDefenderHealth > 0 ? newDefenderHealth : 0;

        const embed = new EmbedBuilder()
            .setColor(rarityColors[player.pet.rarity.toLowerCase()] || '#888888')
            .setTitle('Battle Turn')
            .setDescription(attackMessage)
            .addFields(
                { name: `${player.pet.name} (HP: ${player.pet.stats.hp})`, value: 'Your Turn', inline: true },
                { name: `${opponent.pet.name} (HP: ${opponent.pet.stats.hp})`, value: 'Opponent', inline: true }
            );
        await message.channel.send({ embeds: [embed] });

        if (opponent.pet.stats.hp <= 0) {
            const winnerDoc = await Pet.findById(player.originalPetId);
            const loserDoc = await Pet.findById(opponent.originalPetId);

            winnerDoc.battleRecord.wins += 1;
            loserDoc.battleRecord.losses += 1;
            loserDoc.isDead = true;

            await winnerDoc.save();
            await loserDoc.save();

            activeBattles.delete(battle.id);

            const winEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎉 Battle Over! 🎉')
                .setDescription(`**${winnerDoc.name}** is victorious! ${loserDoc.name} has been defeated.`);
            return message.channel.send({ embeds: [winEmbed] });
        }

        battle.turn = opponentId;
        message.channel.send(`It is now ${opponent.user.username}'s turn!`);
    },
};