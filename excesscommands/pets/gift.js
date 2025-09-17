const { EmbedBuilder } = require('discord.js');
const Pet = require('../../models/pets/pets');
const { getEconomyProfile, updateEconomyProfile } = require('../../models/economy');

module.exports = {
    name: 'gift',
    description: 'Gift a pet, egg, or supply to another user.',
    aliases: [],
    async execute(message, args) {
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('You need to mention a user to gift an item to.');
        }

        if (targetUser.id === message.author.id) {
            return message.reply('You cannot gift an item to yourself.');
        }

        const itemName = args.slice(1).join(' ').toLowerCase();
        if (!itemName) {
            return message.reply('You need to specify the item you want to gift.');
        }

        const senderId = message.author.id;
        const receiverId = targetUser.id;

        // Check for pet
        const pet = await Pet.findOne({ ownerId: senderId, name: new RegExp(`^${itemName}$`, 'i') });

        if (pet) {
            pet.ownerId = receiverId;
            await pet.save();
            return message.reply(`You have gifted your pet, **${pet.name}**, to **${targetUser.username}**.`);
        }

        // Check for inventory item (egg or supply)
        const senderProfile = await getEconomyProfile(senderId);
        const itemIndex = senderProfile.inventory.findIndex(item => item.name.toLowerCase() === itemName);

        if (itemIndex > -1) {
            const [item] = senderProfile.inventory.splice(itemIndex, 1);

            const receiverProfile = await getEconomyProfile(receiverId);
            receiverProfile.inventory.push(item);

            await updateEconomyProfile(senderId, { inventory: senderProfile.inventory });
            await updateEconomyProfile(receiverId, { inventory: receiverProfile.inventory });

            return message.reply(`You have gifted **1x ${item.name}** to **${targetUser.username}**.`);
        }

        return message.reply("You don\'t own a pet or item with that name.");
    }
};