const { EmbedBuilder } = require('discord.js');
const Pet = require('../../models/pets/pets');

// A simple in-memory store for active battles
const activeBattles = new Map();

module.exports = {
    name: 'battle',
    description: 'Challenge another user\'s pet to a battle.',
    async execute(message, args) {
        const challenger = message.author;
        const opponentUser = message.mentions.users.first();

        if (!opponentUser) {
            return message.reply('You need to mention a user to challenge them to a battle.');
        }

        if (opponentUser.id === challenger.id) {
            return message.reply('You cannot battle yourself.');
        }

        const challengerPetName = args.find(arg => !arg.startsWith('<') && !arg.endsWith('>'));
        const opponentPetName = args.filter(arg => !arg.startsWith('<') && !arg.endsWith('>'))[1];

        if (!challengerPetName || !opponentPetName) {
            return message.reply('You need to specify your pet and the opponent\'s pet.');
        }

        const challengerPet = await Pet.findOne({ ownerId: challenger.id, name: challengerPetName });
        const opponentPet = await Pet.findOne({ ownerId: opponentUser.id, name: opponentPetName });

        if (!challengerPet) {
            return message.reply(`You don\'t have a pet named ${challengerPetName}.`);
        }

        if (!opponentPet) {
            return message.reply(`${opponentUser.username} does not have a pet named ${opponentPetName}.`);
        }

        const battleId = `${challenger.id}-${opponentUser.id}`;
        if (activeBattles.has(battleId)) {
            return message.reply('You already have an active battle with this user.');
        }

        // Store battle state
        activeBattles.set(battleId, {
            turn: challenger.id,
            challenger: { id: challenger.id, pet: challengerPet },
            opponent: { id: opponentUser.id, pet: opponentPet },
        });

        const embed = new EmbedBuilder()
            .setTitle(`⚔️ ${challenger.username} challenges ${opponentUser.username} to a battle! ⚔️`)
            .setDescription(`${challengerPet.name} vs. ${opponentPet.name}`)
            .setColor('#FF0000');

        message.reply({ embeds: [embed] });
        message.channel.send(`${opponentUser}, do you accept the challenge? (yes/no)`);

        const filter = (response) => response.author.id === opponentUser.id && ['yes', 'no'].includes(response.content.toLowerCase());
        const collector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });

        collector.on('collect', (response) => {
            if (response.content.toLowerCase() === 'yes') {
                message.channel.send('The battle will begin shortly!');
                // Future: Implement turn-based logic here
            } else {
                message.channel.send('The challenge was declined.');
                activeBattles.delete(battleId);
            }
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                message.channel.send('The challenge expired.');
                activeBattles.delete(battleId);
            }
        });
    },
};
