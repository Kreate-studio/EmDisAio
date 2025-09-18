const { EmbedBuilder } = require('discord.js');
const { getEconomyProfile, updateEconomyProfile } = require('../../models/economy');
const { Egg } = require('../../models/pets/eggs');

module.exports = {
    name: 'buyegg',
    description: 'Buy a pet egg from the shop.',
    async execute(message, args) {
        const userId = message.author.id;
        const eggType = args.join(' ');

        if (!eggType) {
            return message.reply('Please specify which egg you want to buy.');
        }

        const egg = await Egg.findOne({ eggType: { $regex: new RegExp(`^${eggType}$`, 'i') } });

        if (!egg) {
            return message.reply('That egg type does not exist.');
        }

        const profile = await getEconomyProfile(userId);

        if (profile.balance < egg.price) {
            return message.reply('You do not have enough money to buy this egg.');
        }

        // Atomically update balance and inventory in one operation
        await updateEconomyProfile(userId, {
            $inc: { balance: -egg.price },
            $push: { inventory: { id: egg.eggType, name: egg.eggType } }
        });

        const embed = new EmbedBuilder()
            .setTitle(`You bought a ${egg.eggType}!`)
            .setDescription(`You can hatch it with the \`/hatch\` command.`)
            .setColor('#00FF00');

        message.reply({ embeds: [embed] });
    },
};