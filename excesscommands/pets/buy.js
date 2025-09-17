const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile, updateWallet, updateGold, addToInventory } = require('../../models/economy');
const { Pet } = require('../../models/pets/pets');
const allItems = require('../../data/petShopItems');
const allPets = require('../../data/pets');
const { v4: uuidv4 } = require('uuid');

const allPossibleItems = [...Object.values(allItems).flat(), ...allPets];

async function handlePetPurchase(user, item) {
    const userId = user.id;
    const profile = await getEconomyProfile(userId);

    if (item.rarity === 'Exclusive' || item.price === null) {
        throw new Error('This item is exclusive and cannot be purchased.');
    }

    if (item.currency === 'gold') {
        if (profile.gold < item.price) {
            throw new Error('You do not have enough gold for this item.');
        }
    } else {
        if (profile.wallet < item.price) {
            throw new Error(`You need $${item.price.toLocaleString()}, but you only have $${profile.wallet.toLocaleString()}.`);
        }
    }
    
    if (item.currency === 'gold') {
        await updateGold(userId, -item.price);
    } else {
        await updateWallet(userId, -item.price);
    }

    const newPet = new Pet({
        petId: uuidv4(),
        ownerId: userId,
        name: item.name,
        species: item.species,
        rarity: item.rarity,
        stats: {
            hp: 100,
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
}

async function handleItemPurchase(user, item) {
    const userId = user.id;
    const profile = await getEconomyProfile(userId);

    if (item.rarity === 'Exclusive' || item.price === null) {
        throw new Error('This item is exclusive and cannot be purchased.');
    }

    if (item.currency === 'gold') {
        if (profile.gold < item.price) {
            throw new Error('You do not have enough gold for this item.');
        }
    } else {
        if (profile.wallet < item.price) {
            throw new Error(`You need $${item.price.toLocaleString()}, but you only have $${profile.wallet.toLocaleString()}.`);
        }
    }

    if (!item.stackable && profile.inventory.some(i => i.id === item.id)) {
        throw new Error(`You can only own one **${item.name}**.`);
    }

    if (item.currency === 'gold') {
        await updateGold(userId, -item.price);
    } else {
        await updateWallet(userId, -item.price);
    }

    const itemData = { 
        id: item.id, 
        name: item.name, 
        type: item.type, 
        purchaseDate: new Date(),
        purchasePrice: item.price
    };
    await addToInventory(userId, itemData);
}

module.exports = {
    name: 'petbuy',
    description: 'Buy a pet, egg, or item from the shop.',
    aliases: ['pb'],
    async execute(message, args) {
        const itemName = args.join(' ');
        if (!itemName) {
            return message.reply({ content: 'Please specify an item to buy.', ephemeral: true });
        }

        const item = allPossibleItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (!item) {
            return message.reply({ content: `Could not find an item named "${itemName}".`, ephemeral: true });
        }

        try {
            if (item.type === 'pet') {
                await handlePetPurchase(message.author, item);
                message.reply(`🎉 You have successfully purchased a new pet: **${item.name}**!`);
            } else {
                await handleItemPurchase(message.author, item);
                message.reply(`🎉 You have successfully purchased **1x ${item.name}**!`);
            }
        } catch (error) {
            message.reply({ content: error.message, ephemeral: true });
        }
    },
};