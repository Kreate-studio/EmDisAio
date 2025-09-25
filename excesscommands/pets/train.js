const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { Pet } = require('../../models/pets/pets');
const { getEconomyProfile, updateWallet } = require('../../models/economy');

const TRAINING_COST = 50;
const COOLDOWN_MINUTES = 5;

async function trainPet(interaction, pet) {
    const userId = interaction.user.id;
    const now = new Date();
    if (pet.cooldowns.train) {
        const lastTrain = new Date(pet.cooldowns.train);
        const diffMinutes = Math.floor((now - lastTrain) / (1000 * 60));

        if (diffMinutes < COOLDOWN_MINUTES) {
            const remainingTime = COOLDOWN_MINUTES - diffMinutes;
            return interaction.reply({ content: `${pet.name} is tired. It needs to rest for **${remainingTime} more minute(s)** before it can train again.`, ephemeral: true });
        }
    }

    if (pet.isDead) {
        return interaction.reply({ content: `You cannot train a defeated pet. Please revive it first.`, ephemeral: true });
    }

    if (pet.stats.energy < 30) {
        return interaction.reply({ content: `${pet.name} is too tired to train. It needs to rest.`, ephemeral: true });
    }

    if (pet.stats.hunger < 15) {
        return interaction.reply({ content: `${pet.name} is too hungry to train. It needs to be fed.`, ephemeral: true });
    }

    const profile = await getEconomyProfile(userId);
    if (profile.wallet < TRAINING_COST) {
        return interaction.reply({ content: `You don\'t have enough money to train your pet. Training costs $${TRAINING_COST}.`, ephemeral: true });
    }

    await updateWallet(userId, -TRAINING_COST);

    const xpGained = Math.floor(Math.random() * (30 - 15 + 1)) + 15; // Random XP between 15 and 30
    const leveledUp = await pet.addXP(xpGained);

    pet.stats.energy -= 30;
    pet.stats.hunger -= 15;
    pet.cooldowns.train = now;
    await pet.save();

    const embed = new EmbedBuilder()
        .setTitle(`${pet.name} finished training!`)
        .setColor('#A020F0');

    let description = `${pet.name} gained **${xpGained} XP**!`;
    if (leveledUp) {
        description += `\n\n**Congratulations!** ${pet.name} grew to **Level ${pet.level}**!\nTheir stats have increased!`;
    }

    embed.setDescription(description);
    embed.addFields(
        { name: 'Energy', value: `-30 (Current: ${pet.stats.energy})`, inline: true },
        { name: 'Hunger', value: `-15 (Current: ${pet.stats.hunger})`, inline: true },
    );

    if (interaction.isMessageComponent()) {
        await interaction.update({ content: ' ', embeds: [embed], components: [] });
    } else {
        await interaction.reply({ embeds: [embed] });
    }
}

module.exports = {
    name: 'train',
    description: 'Train a pet to increase its XP and level it up. If no pet is specified, a selection menu will appear.',
    async execute(message, args) {
        const userId = message.author.id;
        const petName = args.join(' ').trim();

        if (petName) {
            const pet = await Pet.findOne({ ownerId: userId, name: { $regex: new RegExp(`^${petName}$`, 'i') } });
            if (!pet) {
                return message.reply(`You don\'t have a pet named "${petName}".`);
            }
            return trainPet(message, pet);
        } else {
            const userPets = await Pet.find({ ownerId: userId });

            if (userPets.length === 0) {
                return message.reply('You don\'t have any pets to train.');
            }

            if (userPets.length === 1) {
                return trainPet(message, userPets[0]);
            }

            const options = userPets.map(pet => ({
                label: pet.name,
                description: `Level: ${pet.level}, XP: ${pet.xp}/${pet.xpToNextLevel} - ${pet.isDead ? 'Defeated' : 'Alive'}`,
                value: pet._id.toString(),
            }));

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('train_pet_select')
                    .setPlaceholder('Select a pet to train...')
                    .addOptions(options)
            );

            const selectMessage = await message.reply({ content: 'You have multiple pets. Please select one to train:', components: [row] });

            const collector = selectMessage.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60000,
                filter: i => i.user.id === userId && i.customId === 'train_pet_select'
            });

            collector.on('collect', async i => {
                const selectedPetId = i.values[0];
                const selectedPet = userPets.find(p => p._id.toString() === selectedPetId);
                if (selectedPet) {
                    await trainPet(i, selectedPet);
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    selectMessage.edit({ content: 'Pet selection timed out.', components: [] });
                }
            });
        }
    },
};