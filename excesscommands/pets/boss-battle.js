const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Event = require('../../models/pets/events');
const { Pet } = require('../../models/pets/pets');
const { updateGold, addToInventory } = require('../../models/economy');
const GuildSettings = require('../../models/guild/GuildSettings');

async function startAutomatedBattle(client, eventId) {
    const event = await Event.findById(eventId);
    if (!event || event.type !== 'boss') return;

    const guildSettings = await GuildSettings.findOne({ guildId: client.guilds.cache.first().id });
    const channel = client.channels.cache.get(guildSettings.bossFightChannelId);

    if (!channel) return;

    const participants = Array.from(event.participants.keys());
    const participantPets = [];
    for (const userId of participants) {
        const pets = await Pet.find({ ownerId: userId, isDead: false, energy: { $gt: 0 } });
        participantPets.push(...pets.map(pet => ({ ...pet.toObject(), ownerId: userId })));
    }

    if (participantPets.length === 0) {
        await channel.send(`The boss, **${event.name}**, has appeared, but no pets were ready to fight. The boss leaves victorious.`);
        event.endAt = new Date();
        await event.save();
        return;
    }

    let battleLog = 'The battle begins!\n\n';
    const battleEmbed = new EmbedBuilder()
        .setTitle(`Automated Battle: ${event.name}`)
        .setDescription('The fight is starting... get ready!')
        .setColor('#ff0000');
    const battleMessage = await channel.send({ embeds: [battleEmbed] });

    const interval = setInterval(async () => {
        let turnLog = '';

        // Pets' turn
        participantPets.forEach(pet => {
            if (pet.stats.hp > 0 && event.bossHp > 0) {
                const damage = Math.max(1, Math.floor(pet.stats.attack * 0.8));
                event.bossHp -= damage;
                turnLog += `${pet.name} hits **${event.name}** for ${damage} damage!\n`;
            }
        });

        // Boss's turn
        if (event.bossHp > 0) {
            const alivePets = participantPets.filter(p => p.stats.hp > 0);
            if (alivePets.length > 0) {
                const targetPet = alivePets[Math.floor(Math.random() * alivePets.length)];
                const damage = Math.max(1, Math.floor(event.rewards.gold * 0.1)); // Boss attack based on gold reward
                targetPet.stats.hp -= damage;
                turnLog += `**${event.name}** strikes ${targetPet.name} for ${damage} damage!\n`;
            }
        }

        battleLog += turnLog + '\n';
        const updatedEmbed = new EmbedBuilder()
            .setTitle(`Automated Battle: ${event.name}`)
            .setDescription(battleLog)
            .setColor('#ff0000')
            .addFields(
                { name: 'Boss HP', value: `${event.bossHp > 0 ? event.bossHp : 0}` },
                { name: 'Pets Remaining', value: `${participantPets.filter(p => p.stats.hp > 0).length}` }
            );
        await battleMessage.edit({ embeds: [updatedEmbed] });

        if (event.bossHp <= 0 || participantPets.every(p => p.stats.hp <= 0)) {
            clearInterval(interval);
            concludeBattle(channel, event, participantPets);
        }
    }, 5000);
}

async function concludeBattle(channel, event, participantPets) {
    if (event.bossHp <= 0) {
        await channel.send(`**${event.name} has been defeated!** Distributing rewards...`);

        const goldReward = event.rewards.gold;
        const itemReward = event.rewards.item;
        const xpReward = event.rewards.xp;
        const participants = Array.from(event.participants.keys());

        const rewardPromises = participants.map(async (userId) => {
            await updateGold(userId, goldReward);
            await addToInventory(userId, { id: itemReward, uniqueId: `${Date.now()}-${userId}` });
            const userPets = await Pet.find({ ownerId: userId });
            const xpPerPet = Math.floor(xpReward / userPets.length);
            if (xpPerPet > 0) {
                await Pet.updateMany({ ownerId: userId }, { $inc: { xp: xpPerPet } });
            }
        });

        await Promise.all(rewardPromises);
        await channel.send(`All participants have received **${goldReward} Gold**, **1x ${itemReward}**, and their pets have shared **${xpReward} XP**!`);

    } else {
        await channel.send(`The pets fought bravely, but **${event.name}** was too strong. The boss has escaped.`);
    }

    event.endAt = new Date();
    await event.save();
}

module.exports = {
    name: 'boss-battle',
    description: 'Initiates a lobby for an automated boss battle.',
    async execute(message) {
        const event = await Event.findOne({ type: 'boss', endAt: { $gt: new Date() } });
        if (!event) {
            return message.reply('There is no boss ready for battle.');
        }

        const joinButton = new ButtonBuilder().setCustomId('join_boss_battle').setLabel('Join the Fray!').setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder().addComponents(joinButton);

        const embed = new EmbedBuilder()
            .setTitle(`A wild ${event.name} appears!`)
            .setDescription('A mighty boss is challenging all pet owners! Click the button to send your pets into the automated battle. The fight will begin in **5 minutes**.')
            .setColor('#FFA500');
        
        const reply = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async interaction => {
            if (!event.participants.has(interaction.user.id)) {
                event.participants.set(interaction.user.id, { joinedAt: new Date() });
                await event.save();
                interaction.reply({ content: 'Your pets have joined the upcoming battle!', ephemeral: true });
            } else {
                interaction.reply({ content: 'Your pets are already in the queue!', ephemeral: true });
            }
        });

        collector.on('end', () => {
            reply.edit({ components: [] }); // Remove button after lobby closes
            message.channel.send('The lobby has closed. The automated battle is starting now!');
            startAutomatedBattle(message.client, event._id);
        });
    },
};
