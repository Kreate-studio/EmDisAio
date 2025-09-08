const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile, updateEconomyProfile, removeFromInventory, addToInventory, updateWallet } = require('../../models/economy');
const { getRandomReward } = require('../../data/lootboxRewards');
const { shopItems } = require('../../data/shopItems');

const allItems = Object.values(shopItems).flat();

const useableItems = {
    'xp boost': { duration: 60 * 60 * 1000, description: 'XP gain is doubled for 1 hour.' },
    'potion of luck': { duration: 60 * 60 * 1000, description: 'Luck increased by 10% for 1 hour.' },
    'energy drink': { duration: 30 * 60 * 1000, description: 'Work cooldown reduced by 50% for 30 minutes.' },
    'anti-rob shield': { duration: 24 * 60 * 60 * 1000, description: 'You are protected from one robbery attempt for 24 hours.' },
    'bank vault upgrade': { permanent: true, description: 'Your bank vault has been permanently upgraded, increasing its limit by 25%.' },
    'safe house': { permanent: true, description: 'You now have a Safe House, permanently decreasing your chances of being robbed.' },
};

module.exports = {
    name: 'use',
    description: 'Use a consumable, upgrade, or open a lootbox from your inventory.',
    async execute(message, args) {
        const itemName = args.join(' ').toLowerCase();
        const userId = message.author.id;

        if (!itemName) {
            return message.reply('Please specify which item you want to use. `use <item name>`');
        }

        const profile = await getEconomyProfile(userId);
        const itemInInventory = profile.inventory.find(i => i.name.toLowerCase() === itemName);

        if (!itemInInventory) {
            return message.reply(`You do not have a "${itemName}" in your inventory.`);
        }

        if (itemInInventory.type === 'lootbox') {
            return handleLootbox(message, userId, itemInInventory);
        }

        const itemToUse = useableItems[itemName];
        if (!itemToUse) {
            return message.reply(`The item "${itemName}" is not a usable item.`);
        }

        let updateData = {};
        let activeEffects = profile.activeEffects || [];

        if (itemToUse.permanent) {
            if (itemName === 'bank vault upgrade') {
                const currentBankLimit = profile.bankLimit || 50000; 
                updateData.bankLimit = Math.floor(currentBankLimit * 1.25);
            } else if (itemName === 'safe house') {
                updateData['upgrades.hasSafehouse'] = true;
            }
        } else {
            const now = Date.now();
            const existingEffectIndex = activeEffects.findIndex(e => e.name.toLowerCase() === itemName);
            if (existingEffectIndex !== -1) {
                activeEffects[existingEffectIndex].expiresAt = now + itemToUse.duration;
            } else {
                activeEffects.push({
                    name: itemInInventory.name,
                    expiresAt: now + itemToUse.duration,
                    description: itemToUse.description
                });
            }
            updateData.activeEffects = activeEffects;
        }
        
        await removeFromInventory(userId, itemInInventory.uniqueId); 
        await updateEconomyProfile(userId, updateData);

        const embed = new EmbedBuilder()
            .setTitle('✅ Item Used Successfully')
            .setDescription(`You have used **${itemInInventory.name}**.`) 
            .addFields({ name: 'Effect', value: itemToUse.description })
            .setColor('#2ECC71')
            .setFooter({ text: `Check your updated status with the /profile command.` });

        await message.reply({ embeds: [embed] });
    },
};

async function handleLootbox(message, userId, lootbox) {
    const lootboxId = `lootbox_${lootbox.id}`;
    const reward = getRandomReward(lootboxId);

    if (!reward) {
        return message.reply('Could not determine a reward for this lootbox. Please contact an admin.');
    }

    let rewardDescription = '';
    if (reward.type === 'cash') {
        await updateWallet(userId, reward.reward.amount);
        rewardDescription = `$${reward.reward.amount.toLocaleString()}`;
    } else if (reward.type === 'item') {
        const itemInfo = allItems.find(i => i.id === reward.reward.id);
        if (itemInfo) {
            await addToInventory(userId, { ...itemInfo, uniqueId: `${Date.now()}-${userId}` });
            rewardDescription = `1x ${itemInfo.name}`;
        } else {
            return message.reply('An error occurred while granting your item reward.');
        }
    }

    await removeFromInventory(userId, lootbox.uniqueId);

    const embed = new EmbedBuilder()
        .setTitle(`🎁 You opened a ${lootbox.name}! 🎁`)
        .setDescription(`You received: **${rewardDescription}**`)
        .setColor('#FFD700');

    await message.reply({ embeds: [embed] });
}