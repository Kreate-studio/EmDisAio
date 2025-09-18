const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');
const { Egg } = require('../../models/pets/eggs');
const species = require('../../models/pets/species');
const rarityColors = require('../../utils/rarityColors');

module.exports = {
    name: 'hatch',
    description: 'Hatches an egg to get a new pet.',
    async execute(message, args) {
        const eggName = args.join(' ');
        if (!eggName) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('Usage: `$pet hatch <egg_name>`');
            return message.reply({ embeds: [embed] });
        }

        const egg = await Egg.findOne({ ownerId: message.author.id, name: eggName });
        if (!egg) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`You don\'t own an egg named "${eggName}".`);
            return message.reply({ embeds: [embed] });
        }

        const availableSpecies = species[egg.rarity.toLowerCase()];
        if (!availableSpecies || availableSpecies.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('Something went wrong! There are no available species for this egg rarity.');
            return message.reply({ embeds: [embed] });
        }

        const randomSpecies = availableSpecies[Math.floor(Math.random() * availableSpecies.length)];

        const pet = new Pet({
            ownerId: message.author.id,
            name: randomSpecies.name,
            species: randomSpecies.name,
            rarity: egg.rarity,
            image: randomSpecies.image,
            level: 1,
            xp: 0,
            nextLevelXP: 100,
            hp: 100,
            attack: 10,
            defense: 10,
            speed: 10,
            happiness: 50,
            lastFed: new Date(),
            lastPlayed: new Date(),
            lastRested: new Date()
        });

        await pet.save();
        await Egg.deleteOne({ _id: egg._id });

        const embed = new EmbedBuilder()
            .setColor(rarityColors[pet.rarity.toLowerCase()] || rarityColors.common)
            .setTitle('🥚 An egg has hatched!')
            .setDescription(`You got a new pet: **${pet.name}**! It is a ${pet.rarity} ${pet.species}.`);

        message.reply({ embeds: [embed] });
    },
};
