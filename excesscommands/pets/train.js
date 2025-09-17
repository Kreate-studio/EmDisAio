const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');

module.exports = {
    name: 'train',
    description: 'Train your pet to gain XP and level up.',
    async execute(message, args) {
        const userId = message.author.id;
        const petName = args[0];

        if (!petName) {
            return message.reply('Please specify which pet you want to train.');
        }

        const pet = await Pet.findOne({ ownerId: userId, name: petName });

        if (!pet) {
            return message.reply(`You don\'t own a pet named ${petName}.`);
        }

        if (pet.stats.energy < 20) {
            return message.reply(`${pet.name} is too tired to train. Let it rest first.`);
        }

        // Decrease energy and add XP
        pet.stats.energy -= 20;
        const xpGained = Math.floor(Math.random() * 20) + 10; // Gain 10-30 XP
        pet.xp += xpGained;

        let levelUp = false;
        let xpForNextLevel = 100 * Math.pow(pet.level, 2);

        if (pet.xp >= xpForNextLevel) {
            pet.level++;
            pet.xp -= xpForNextLevel;
            levelUp = true;

            // Increase base stats
            pet.stats.hp += 10;
            pet.stats.attack += 2;
            pet.stats.defense += 2;
            pet.stats.speed += 1;
        }

        await pet.save();

        const embed = new EmbedBuilder()
            .setTitle(`${pet.name} finished training!`)
            .setDescription(`${pet.name} gained ${xpGained} XP.`)
            .setColor('#00FF00');

        if (levelUp) {
            embed.addFields({ name: 'Level Up!', value: `${pet.name} is now level ${pet.level}!` });
        }

        message.reply({ embeds: [embed] });
    },
};
