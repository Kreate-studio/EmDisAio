const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile, addToInventory } = require('../../models/economy');
const { Pet } = require('../../models/pets/pets');
const allItems = require('../../data/petShopItems');
const allPets = require('../../data/pets');
const { v4: uuidv4 } = require('uuid');

const allPossibleItems = [...Object.values(allItems).flat(), ...Object.values(allPets).flat()];

module.exports = {
    name: 'give',
    description: 'Give a pet, egg, or item to a user.',
    aliases: ['gp'],
    async execute(message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply({ content: 'You must be an administrator to use this command.', ephemeral: true });
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply({ content: 'Please mention a user to give an item to.', ephemeral: true });
        }

        const receiverId = targetUser.id;
        const itemName = args.slice(1).join(' ');
        if (!itemName) {
            return message.reply({ content: 'Please specify an item to give.', ephemeral: true });
        }

        const item = allPossibleItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (!item) {
            return message.reply({ content: `Could not find an item named "${itemName}".`, ephemeral: true });
        }

        if (item.type === 'pet') {
            const newPet = new Pet({
                petId: uuidv4(),
                ownerId: receiverId,
                name: item.name,
                species: item.species,
                rarity: item.rarity,
                image: item.image,
                stats: {
                    hp: 100,
                    maxHealth: 100,
                    attack: item.stats.attack,
                    defense: item.stats.defense,
                    speed: item.stats.speed,
                    hunger: 100,
                    happiness: 100,
                    energy: 100,
                },
                abilities: item.abilities,
                specialAbilities: item.specialAbilities,
            });
            await newPet.save();
            return message.reply(`You have given a new pet, **${item.name}**, to **${targetUser.username}**.`);
        } else {
            const itemData = {
                id: item.id,
                name: item.name,
                type: item.type,
                rarity: item.rarity,
                image: item.image,
                purchaseDate: new Date(),
                purchasePrice: 0,
                uniqueId: uuidv4()
            };
            await addToInventory(receiverId, itemData);
            return message.reply(`You have given **1x ${item.name}** to **${targetUser.username}**.`);
        }
    },
};
