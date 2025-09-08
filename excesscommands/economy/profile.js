const { EmbedBuilder } = require('discord.js');
const { getAllEconomyProfiles } = require('../../models/economy');
const { shopItems } = require('../../data/shopItems');
const { stocks } = require('../../data/stocks');

const allItems = Object.values(shopItems).flat();
const itemPrices = allItems.reduce((acc, item) => {
    acc[item.id] = item.price;
    return acc;
}, {});

const calculateNetWorth = (profile) => {
    if (!profile) return 0;

    const wallet = profile.wallet || 0;
    const bank = profile.bank || 0;
    const loan = profile.loan || 0;
    const loanAmount = (typeof loan === 'object' && typeof loan.amount === 'number') ? loan.amount : (typeof loan === 'number' ? loan : 0);

    const inventoryValue = (profile.inventory || []).reduce((total, item) => {
        const price = item.purchasePrice || itemPrices[item.id] || 0;
        return total + price;
    }, 0);

    const investmentsValue = (profile.investments || []).reduce((total, investment) => {
        if (!investment || typeof investment.shares !== 'number' || !investment.symbol) return total;
        const stockInfo = stocks[investment.symbol];
        const currentPrice = stockInfo ? stockInfo.price : investment.purchasePrice;
        const priceToUse = typeof currentPrice === 'number' ? currentPrice : 0;
        return total + (investment.shares * priceToUse);
    }, 0);

    return wallet + bank + inventoryValue + investmentsValue - loanAmount;
};

module.exports = {
    name: 'profile',
    description: "Displays a user's complete economic profile and wealth rank.",
    aliases: ['moneyprofile', 'wealth'],
    async execute(message, args) {
        const targetUser = message.mentions.users.first() || message.author;
        const userId = targetUser.id;

        const allProfiles = await getAllEconomyProfiles();
        const profile = allProfiles.find(p => p.userId === userId);

        if (!profile) {
            return message.reply("This user doesn't have an economy profile yet.");
        }

        const rankedUsers = allProfiles
            .map(p => ({ userId: p.userId, netWorth: calculateNetWorth(p) }))
            .sort((a, b) => b.netWorth - a.netWorth);

        const userRank = rankedUsers.findIndex(u => u.userId === userId) + 1;
        const totalUsers = rankedUsers.length;

        const netWorth = rankedUsers[userRank - 1].netWorth;
        const wallet = profile.wallet || 0;
        const bank = profile.bank || 0;
        const bankLimit = profile.bankLimit || 10000; // <<< Get bank limit, with a fallback
        const loanAmount = (typeof profile.loan === 'object' && typeof profile.loan.amount === 'number') ? profile.loan.amount : (typeof profile.loan === 'number' ? profile.loan : 0);
        const inventoryValue = (profile.inventory || []).reduce((total, item) => total + (item.purchasePrice || itemPrices[item.id] || 0), 0);
        const investmentsValue = (profile.investments || []).reduce((total, inv) => {
            if (!inv || !inv.symbol || typeof inv.shares !== 'number') return total;
            const stockInfo = stocks[inv.symbol];
            const currentPrice = stockInfo ? stockInfo.price : inv.purchasePrice;
            return total + (inv.shares * (typeof currentPrice === 'number' ? currentPrice : 0));
        }, 0);
        const xp = profile.xp || 0;

        const embed = new EmbedBuilder()
            .setTitle(`**${targetUser.username}'s Economic Profile**`)
            .setColor('#FFD700')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '👑 __**Wealth Rank**__', value: `**#${userRank}** out of ${totalUsers}` },
                { name: '⭐ __**Experience**__', value: `**XP:** ${xp.toLocaleString()}` },
                { name: '💰 __**Liquid Assets**__', value: `**Wallet:** $${wallet.toLocaleString()}\n**Bank:** $${bank.toLocaleString()} / $${bankLimit.toLocaleString()}` },
                { name: '📊 __**Investments**__', value: `**Total Value:** $${investmentsValue.toLocaleString()}` },
                { name: '📦 __**Inventory**__', value: `**Total Value:** $${inventoryValue.toLocaleString()}` },
                { name: '📉 __**Liabilities**__', value: `**Loan:** $${loanAmount.toLocaleString()}` },
                { name: '💼 __**Net Worth**__', value: `**Approx. Total:** **$${netWorth.toLocaleString()}**` }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();

        // --- Active Effects Display ---
        const now = Date.now();
        const activeEffects = profile.activeEffects?.filter(e => e.expiresAt > now) || [];

        if (activeEffects.length > 0) {
            const effectsList = activeEffects.map(effect => {
                const remaining = effect.expiresAt - now;
                const minutes = Math.ceil(remaining / (60 * 1000));
                return `• **${effect.name}**: ${minutes} minute(s) remaining`;
            }).join('\n');
            embed.addFields({ name: '**Active Statuses**', value: effectsList });
        }

        if (profile.investments && profile.investments.length > 0) {
            const investmentList = profile.investments.slice(0, 5).map(inv => {
                if (!inv || !inv.symbol || typeof inv.shares !== 'number') return '• *Invalid investment data*';
                const stockInfo = stocks[inv.symbol];
                const currentPrice = stockInfo ? stockInfo.price : inv.purchasePrice;
                const value = inv.shares * (typeof currentPrice === 'number' ? currentPrice : 0);
                return `• **${inv.symbol.toUpperCase()}**: ${inv.shares.toLocaleString()} shares - **$${value.toLocaleString()}**`;
            }).join('\n');
            embed.addFields({ name: '**Investment Portfolio**', value: investmentList });
        }

        if (profile.inventory && profile.inventory.length > 0) {
            const inventoryList = profile.inventory.slice(0, 5).map(item => `• ${item.name}`).join('\n');
            embed.addFields({ name: '**Inventory Highlights**', value: inventoryList });
        }

        await message.reply({ embeds: [embed] });
    },
};