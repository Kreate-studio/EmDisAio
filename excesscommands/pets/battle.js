const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');
const { GuildSettings } = require('../../models/guild/GuildSettings'); // Correctly import GuildSettings
const { activeBattles } = require('./battleState');

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

module.exports = {
    name: 'battle',
    description: 'Challenge another user to a pet battle.',
    async execute(message, args) {
        const guildSettings = await GuildSettings.findOne({ guildId: message.guild.id });
        const battleChannelId = guildSettings ? guildSettings.battleChannelId : null;

        if (!battleChannelId) {
            return message.reply('A battle channel has not been set up for this server. An admin must run the `/setup-battle-channel` command first.');
        }

        const battle = [...activeBattles.values()].find(b => b.participants.has(message.author.id));

        if (battle) {
            return message.reply(`You are already in a battle. Head to <#${battleChannelId}> to fight!`);
        }

        const opponentUser = message.mentions.users.first();

        if (!opponentUser) {
            return message.reply('Usage: `$pet battle @user <your-pet-name>`');
        }

        if (opponentUser.bot || opponentUser.id === message.author.id) {
            return message.reply('You cannot battle a bot or yourself.');
        }

        const challengerPetName = args.filter(arg => !arg.startsWith('<@')).join(' ');

        if (!challengerPetName) {
            return message.reply('Usage: `$pet battle @user <your-pet-name>`');
        }

        const challengerPetDoc = await Pet.findOne({ ownerId: message.author.id, name: { $regex: new RegExp(`^${challengerPetName}$`, 'i') } });

        if (!challengerPetDoc) return message.reply(`You do not own a pet named '${challengerPetName}'.`);
        if (challengerPetDoc.isDead || challengerPetDoc.stats.hp <= 0) return message.reply(`Your pet, ${challengerPetDoc.name}, is defeated and cannot battle.`);

        const battleId1 = `${message.author.id}-${opponentUser.id}`;
        const battleId2 = `${opponentUser.id}-${message.author.id}`;
        if (activeBattles.has(battleId1) || activeBattles.has(battleId2)) {
            return message.reply('There is already an active battle or challenge between you and this user.');
        }

        const challengeEmbed = new EmbedBuilder()
            .setTitle('⚔️ A Battle Challenge has been issued! ⚔️')
            .setDescription(`${opponentUser.username}, ${message.author.username} challenges you to a battle with **${challengerPetDoc.name}**.\n\nDo you accept? (yes/no)`)
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
                if (opponentPetDoc.isDead || opponentPetDoc.stats.hp <= 0) {
                    return message.channel.send(`${opponentPetDoc.name} is defeated and cannot battle. Battle cancelled.`);
                }

                const { pet: challengerBattlePet, effects: challengerEffects } = initializePetForBattle(challengerPetDoc);
                const { pet: opponentBattlePet, effects: opponentEffects } = initializePetForBattle(opponentPetDoc);

                let firstTurnUser, turnMessage;
                if (challengerBattlePet.stats.speed > opponentBattlePet.stats.speed) {
                    firstTurnUser = message.author;
                    turnMessage = `**${challengerBattlePet.name}** is faster and gets the first move!`;
                } else if (opponentBattlePet.stats.speed > opponentBattlePet.stats.speed) {
                    firstTurnUser = opponentUser;
                    turnMessage = `**${opponentBattlePet.name}** is faster and gets the first move!`;
                } else {
                    firstTurnUser = Math.random() < 0.5 ? message.author : opponentUser;
                    turnMessage = `Both pets have the same speed! By a coin toss, **${firstTurnUser.username}** gets the first move!`;
                }

                const newBattle = {
                    id: battleId1,
                    turn: firstTurnUser.id,
                    participants: new Map([
                        [message.author.id, { user: message.author, pet: challengerBattlePet, originalPetId: challengerPetDoc._id }],
                        [opponentUser.id, { user: opponentUser, pet: opponentBattlePet, originalPetId: opponentPetDoc._id }]
                    ]),
                };
                activeBattles.set(battleId1, newBattle);

                const battleChannel = message.guild.channels.cache.get(battleChannelId);
                if (!battleChannel) {
                    return message.reply('The battle channel is missing or has been deleted. Please ask an admin to reconfigure it.');
                }

                await message.reply(`The challenge was accepted! Head to <#${battleChannelId}> to begin the fight!`);

                let battleStartMessage = `The battle between ${message.author.username} and ${opponentUser.username} begins!\n\n${turnMessage}\n\nIt is **${firstTurnUser.username}**'s turn!\nUse \`$pet move <ability name>\` to attack.`;
                const allEffects = [...challengerEffects, ...opponentEffects];
                if (allEffects.length > 0) {
                    battleStartMessage += '\n\n**Passive abilities activated:**\n' + allEffects.join('\n');
                }

                const startEmbed = new EmbedBuilder()
                    .setTitle('🔥 The Battle Begins! 🔥')
                    .setDescription(battleStartMessage)
                    .setColor('#FF0000');
                await battleChannel.send({ embeds: [startEmbed] });

            } else {
                await message.channel.send('The challenge was declined.');
            }
        } catch (err) {
            console.log(err); // Log the full error for debugging
            await message.channel.send('The challenge expired without a response or a pet was not chosen in time.');
        }
    },
};