const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');
const { GuildSettings } = require('../../models/guild/GuildSettings');
const rarityColors = require('../../utils/rarityColors');

// In-memory store for active battles
const activeBattles = new Map();

/**
 * Deep clones a pet object and applies passive abilities for the battle duration.
 * @param {object} pet - The original Mongoose pet document.
 * @returns {{pet: object, effects: string[]}} - The cloned pet with modified stats and a list of effect messages.
 */
const initializePetForBattle = (pet) => {
    const battlePet = JSON.parse(JSON.stringify(pet.toObject()));
    const effects = [];

    if (!battlePet.specialAbilities || !Array.isArray(battlePet.specialAbilities)) {
        return { pet: battlePet, effects };
    }

    for (const ability of battlePet.specialAbilities) {
        if (ability.type === 'passive' && ability.effect) {
            let message = '';
            if (ability.effect.defenseBoost) {
                battlePet.stats.defense += ability.effect.defenseBoost;
                message = `🛡️ **${ability.name}** boosted ${battlePet.name}\'s defense by ${ability.effect.defenseBoost}!`;
            }
            if (ability.effect.allyAttackUp) { // In 1v1, this is a self-buff
                battlePet.stats.attack += ability.effect.allyAttackUp;
                message = `⚔️ **${ability.name}** boosted ${battlePet.name}\'s attack by ${ability.effect.allyAttackUp}!`;
            }
            if (ability.effect.randomBuff) {
                const statsToBuff = ability.effect.randomBuff;
                const randomStat = statsToBuff[Math.floor(Math.random() * statsToBuff.length)];
                const boostAmount = Math.round(battlePet.stats[randomStat] * 0.15); // 15% boost
                battlePet.stats[randomStat] += boostAmount;
                message = `✨ **${ability.name}** randomly boosted ${battlePet.name}\'s ${randomStat} by ${boostAmount}!`;
            }
            if (message) effects.push(message);
        }
    }
    return { pet: battlePet, effects };
};


/**
 * Resolves an attack, calculating damage and new health.
 * @param {object} attacker - The attacker\'s battle pet object.
 * @param {object} defender - The defender\'s battle pet object.
 * @param {object} ability - The ability being used.
 * @returns {object} - { damage, newDefenderHealth, message }
 */
const resolveAttack = (attacker, defender, ability) => {
    const baseDamage = ability.effect.damage || attacker.stats.attack / 2;
    let damage = Math.round(baseDamage - (defender.stats.defense * 0.5));
    if (damage < 1) damage = 1; 

    const newDefenderHealth = defender.stats.hp - damage;
    const attackMessage = `${attacker.name} uses **${ability.name}** and deals **${damage}** damage to ${defender.name}!`;

    return { damage, newDefenderHealth, message: attackMessage };
};

module.exports = {
    name: 'battle',
    description: 'Engage in a pet battle or make a move in an ongoing one.',
    async execute(message, args) {
        const guildSettings = await GuildSettings.findOne({ guildId: message.guild.id });
        const battleChannelId = guildSettings ? guildSettings.battleChannelId : null;

        const subCommand = args[0];
        const battle = [...activeBattles.values()].find(b => b.participants.has(message.author.id));

        // --- Battle Move Sub-command ---
        if (subCommand === 'move') {
            if (!battle) {
                return message.reply('You are not currently in a battle.');
            }
            if (battleChannelId && message.channel.id !== battleChannelId) {
                return message.reply(`Battles can only take place in <#${battleChannelId}>.`);
            }
            if (battle.turn !== message.author.id) {
                return message.reply('It is not your turn!');
            }

            const moveName = args.slice(1).join(' ');
            if (!moveName) {
                return message.reply('Usage: `$pet battle move <ability name>`');
            }

            const player = battle.participants.get(message.author.id);
            const opponentId = [...battle.participants.keys()].find(id => id !== message.author.id);
            const opponent = battle.participants.get(opponentId);

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

        // --- Start Battle Sub-command ---
        } else if (!battle && message.mentions.users.first()) {
            if (!battleChannelId) {
                return message.reply('A battle channel has not been set up for this server. An admin must run the `/setup-battle-channel` command first.');
            }

            const challenger = message.author;
            const opponentUser = message.mentions.users.first();
            
            if (opponentUser.bot || opponentUser.id === challenger.id) {
                return message.reply('You cannot battle a bot or yourself.');
            }
            
            const challengerPetName = args.filter(arg => !arg.startsWith('<@')).join(' ');

            if (!challengerPetName) {
                return message.reply('Usage: `$pet battle @user <your-pet-name>`');
            }

            const challengerPetDoc = await Pet.findOne({ ownerId: challenger.id, name: { $regex: new RegExp(`^${challengerPetName}$`, 'i') } });

            if (!challengerPetDoc) return message.reply(`You do not own a pet named '${challengerPetName}'.`);
            if (challengerPetDoc.isDead) return message.reply(`Your pet, ${challengerPetDoc.name}, is defeated and cannot battle.`);

            const battleId = `${challenger.id}-${opponentUser.id}`;
            if (activeBattles.has(battleId)) return message.reply('You are already in a battle with this user.');

            const challengeEmbed = new EmbedBuilder()
                .setTitle('⚔️ A Battle Challenge has been issued! ⚔️')
                .setDescription(`${opponentUser.username}, ${challenger.username} challenges you to a battle with **${challengerPetDoc.name}**.\\n\\nDo you accept? (yes/no)`)
                .setColor('#FFD700');
            await message.channel.send({ content: `${opponentUser}`, embeds: [challengeEmbed] });

            const filter = (response) => response.author.id === opponentUser.id && ['yes', 'no'].includes(response.content.toLowerCase());
            try {
                const collected = await message.channel.awaitMessages({ filter, time: 60000, max: 1, errors: ['time'] });
                if (collected.first().content.toLowerCase() === 'yes') {
                    
                    await message.channel.send(`${opponentUser.username}, please choose your pet by typing its name.`);
                    const petFilter = (response) => response.author.id === opponentUser.id;
                    const petCollected = await message.channel.awaitMessages({ filter: petFilter, max: 1, time: 30000, errors: ['time'] });
                    const opponentPetName = petCollected.first().content.trim();
                    const opponentPetDoc = await Pet.findOne({ ownerId: opponentUser.id, name: { $regex: new RegExp(`^${opponentPetName}$`, 'i') } });

                    if (!opponentPetDoc) {
                        return message.channel.send(`You do not own a pet named '${opponentPetName}'. Battle cancelled.`);
                    }
                    if (opponentPetDoc.isDead) {
                        return message.channel.send(`${opponentPetDoc.name} is defeated and cannot battle. Battle cancelled.`);
                    }

                    const { pet: challengerBattlePet, effects: challengerEffects } = initializePetForBattle(challengerPetDoc);
                    const { pet: opponentBattlePet, effects: opponentEffects } = initializePetForBattle(opponentPetDoc);
                    
                    const newBattle = {
                        id: battleId,
                        turn: challenger.id,
                        participants: new Map([
                            [challenger.id, { user: challenger, pet: challengerBattlePet, originalPetId: challengerPetDoc._id }],
                            [opponentUser.id, { user: opponentUser, pet: opponentBattlePet, originalPetId: opponentPetDoc._id }]
                        ]),
                    };
                    activeBattles.set(battleId, newBattle);
                    
                    const battleChannel = message.guild.channels.cache.get(battleChannelId);
                    if (!battleChannel) {
                        return message.reply('The battle channel is missing or has been deleted. Please ask an admin to reconfigure it.');
                    }

                    await message.reply(`The challenge was accepted! Head to <#${battleChannelId}> to begin the fight!`);

                    let battleStartMessage = `The battle between ${challenger.username} and ${opponentUser.username} begins!\\n\\nIt is **${challenger.username}**'s turn!\\nUse \`$pet battle move <ability name>\` to attack.`;
                    const allEffects = [...challengerEffects, ...opponentEffects];
                    if (allEffects.length > 0) {
                        battleStartMessage += '\\n\\n**Passive abilities activated:**\\n' + allEffects.join('\\n');
                    }

                    const startEmbed = new EmbedBuilder()
                        .setTitle('🔥 The Battle Begins! 🔥')
                        .setDescription(battleStartMessage)
                        .setColor('#FF0000');you 
                    await battleChannel.send({ embeds: [startEmbed] });

                } else {
                    await message.channel.send('The challenge was declined.');
                }
            } catch (err) {
                await message.channel.send('The challenge expired without a response or a pet was not chosen in time.');
            }
        } else if (battle) {
             message.reply(`You are already in a battle. Head to <#${battleChannelId}> to fight!`);
        } else {
            message.reply('Invalid command.\\nTo start a battle: `$pet battle @user <your-pet-name>`\\nTo fight: `$pet battle move <ability-name>`');
        }
    },
};