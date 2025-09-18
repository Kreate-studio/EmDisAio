const { EmbedBuilder } = require('discord.js');
const { Pet } = require('../../models/pets/pets');
const Species = require('../../models/pets/species');

module.exports = {
    name: 'evolve',
    description: 'Evolve your pet to its next stage.',
    async execute(message, args) {
        const userId = message.author.id;
        const petName = args[0];

        if (!petName) {
            return message.reply('Please specify which pet you want to evolve.');
        }

        const pet = await Pet.findOne({ ownerId: userId, name: petName });

        if (!pet) {
            return message.reply(`You don\'t own a pet named ${petName}.`);
        }

        const species = await Species.findOne({ species: pet.species });

        if (!species || !species.evolvesTo) {
            return message.reply(`${pet.name} cannot evolve any further.`);
        }

        const requirements = species.evolvesTo.requirements;

        if (pet.level < requirements.level) {
            return message.reply(`${pet.name} needs to be level ${requirements.level} to evolve.`);
        }

        if (pet.stats.happiness < requirements.happiness) {
            return message.reply(`${pet.name} needs to have ${requirements.happiness} happiness to evolve.`);
        }

        if (pet.battleRecord.wins < requirements.battlesWon) {
            return message.reply(`${pet.name} needs to win ${requirements.battlesWon} battles to evolve.`);
        }

        const newSpecies = await Species.findOne({ species: species.evolvesTo.species });

        if (!newSpecies) {
            return message.reply('Something went wrong during evolution. Please try again later.');
        }

        // Evolve the pet
        pet.species = newSpecies.species;
        pet.rarity = newSpecies.rarity;
        pet.evolutionStage++;

        // Update stats
        pet.stats.hp = newSpecies.baseStats.hp;
        pet.stats.attack = newSpecies.baseStats.attack;
        pet.stats.defense = newSpecies.baseStats.defense;
        pet.stats.speed = newSpecies.baseStats.speed;

        // Update abilities
        if (newSpecies.abilities && newSpecies.abilities.length > 0) {
            pet.abilities = newSpecies.abilities.map(abilityName => ({ name: abilityName }));
        }

        await pet.save();

        const embed = new EmbedBuilder()
            .setTitle(`🌟 Your ${species.species} evolved into a ${newSpecies.species}! 🌟`)
            .setDescription(`${pet.name} is now a ${newSpecies.rarity} ${newSpecies.species}.`)
            .setColor('#FFD700');

        message.reply({ embeds: [embed] });
    },
};