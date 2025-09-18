const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');
const { getEconomyProfile } = require('../../models/economy');

module.exports = {
    name: 'adventure',
    description: 'Send your pet on an adventure to gain XP and find items.',
    async execute(message, args) {
        const userId = message.author.id;
        const petName = args.join(' ');

        if (!petName) {
            return message.reply('Please specify which pet you want to send on an adventure.');
        }

        const pet = await Pet.findOne({ ownerId: userId, name: petName });

        if (!pet) {
            return message.reply(`You don\'t own a pet named ${petName}.`);
        }

        if (pet.stats.energy < 40) {
            return message.reply(`${pet.name} is too tired for an adventure. Let it rest first.`);
        }

        // Decrease energy and add XP
        pet.stats.energy -= 40;
        const xpGained = Math.floor(Math.random() * 40) + 20; // Gain 20-60 XP
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

        let itemFound = null;
        if (Math.random() < 0.2) { // 20% chance to find an item
            const items = ['pet_food', 'pet_toy', 'pet_medicine'];
            itemFound = items[Math.floor(Math.random() * items.length)];
            const profile = await getEconomyProfile(userId);
            profile.inventory.push({ id: itemFound, name: itemFound.replace('_', ' ') });
            await profile.save();
        }

        await pet.save();

        const embed = new EmbedBuilder()
            .setTitle(`${pet.name} returned from its adventure!`)
            .setDescription(`${pet.name} gained ${xpGained} XP.`)
            .setColor('#00FF00');

        if (levelUp) {
            embed.addFields({ name: 'Level Up!', value: `${pet.name} is now level ${pet.level}!` });
        }

        if (itemFound) {
            embed.addFields({ name: 'Item Found!', value: `${pet.name} found a ${itemFound.replace('_', ' ')}!` });
        }

        message.reply({ embeds: [embed] });
    },
};
