const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getEconomyProfile, removeFromInventory } = require('../../models/economy');
const { Pet } = require('../../models/pets/pets');
const species = require('../../data/pets');
const rarityColors = require('../../utils/rarityColors');
const { v4: uuidv4 } = require('uuid');

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

        const profile = await getEconomyProfile(message.author.id);
        const egg = profile.inventory.find(item => item.type === 'egg' && item.name.toLowerCase() === eggName.toLowerCase());

        if (!egg) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`You don't own an egg named "${eggName}".`);
            return message.reply({ embeds: [embed] });
        }

        const hatchButton = new ButtonBuilder()
            .setCustomId('hatch_egg')
            .setLabel('Hatch')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(hatchButton);

        const embed = new EmbedBuilder()
            .setColor(rarityColors[egg.rarity.toLowerCase()] || rarityColors.common)
            .setTitle(`You are about to hatch a ${egg.name}`)
            .setImage(egg.image)
            .setDescription('Click the button below to hatch your egg.');

        const reply = await message.reply({ embeds: [embed], components: [row] });

        const filter = (interaction) => interaction.customId === 'hatch_egg' && interaction.user.id === message.author.id;
        const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            await interaction.update({ components: [] }); // Remove the button

            const hatchingEmbed = new EmbedBuilder()
                .setColor(rarityColors[egg.rarity.toLowerCase()] || rarityColors.common)
                .setTitle('Hatching...')
                .setDescription('Your egg is hatching!');
            await reply.edit({ embeds: [hatchingEmbed] });

            setTimeout(async () => {
                const availableSpecies = species[egg.rarity.toLowerCase()];
                if (!availableSpecies || availableSpecies.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('Something went wrong! There are no available species for this egg rarity.');
                    return reply.edit({ embeds: [errorEmbed] });
                }

                const randomSpecies = availableSpecies[Math.floor(Math.random() * availableSpecies.length)];

                const pet = new Pet({
                    petId: uuidv4(),
                    ownerId: message.author.id,
                    name: randomSpecies.name,
                    species: randomSpecies.name,
                    rarity: egg.rarity,
                    image: randomSpecies.image,
                    level: 1,
                    xp: 0,
                    nextLevelXP: 100,
                    stats: {
                        maxHealth: 100,
                        hp: 100,
                        attack: randomSpecies.stats.attack,
                        defense: randomSpecies.stats.defense,
                        speed: randomSpecies.stats.speed,
                        happiness: 50,
                        hunger: 100
                    },
                    abilities: randomSpecies.abilities, // Added abilities
                    specialAbilities: randomSpecies.specialAbilities, // Added special abilities
                });

                await pet.save();
                await removeFromInventory(message.author.id, egg.uniqueId);

                const successEmbed = new EmbedBuilder()
                    .setColor(rarityColors[pet.rarity.toLowerCase()] || rarityColors.common)
                    .setTitle('🥚 An egg has hatched!')
                    .setDescription(`You got a new pet: **${pet.name}**! It is a ${pet.rarity} ${pet.species}.`)
                    .setImage(pet.image);

                await reply.edit({ embeds: [successEmbed] });
            }, 3000); // 3-second delay
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('You did not hatch the egg in time.');
                reply.edit({ embeds: [timeoutEmbed], components: [] });
            }
        });
    },
};
