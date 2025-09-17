const { petShopItems } = require('./petShopItems');

const shopItems = {
    "Real Estate": [
        {
            id: "apartment",
            name: "Cozy Apartment",
            description: "A small but comfortable apartment in the city center.",
            price: 150000,
            monthlyUpkeep: 1500, // Property taxes and maintenance
            type: "house",
            stackable: false,
            category: "Real Estate"
        },
        {
            id: "house",
            name: "Suburban House",
            description: "A lovely house with a yard in a quiet neighborhood.",
            price: 300000,
            monthlyUpkeep: 3000,
            type: "house",
            stackable: false,
            category: "Real Estate"
        },
        {
            id: "mansion",
            name: "Luxury Mansion",
            description: "A sprawling mansion with all the amenities you could dream of.",
            price: 1000000,
            monthlyUpkeep: 10000,
            type: "house",
            stackable: false,
            category: "Real Estate"
        },
        {
            id: "studio_loft",
            name: "Studio Loft",
            description: "A compact modern loft with skyline views.",
            price: 90000,
            monthlyUpkeep: 900,
            type: "house",
            stackable: false,
            category: "Real Estate"
        },
        {
            id: "beach_villa",
            name: "Beachfront Villa",
            description: "Luxury villa right on the beach, perfect for flexing.",
            price: 2000000,
            monthlyUpkeep: 20000,
            type: "house",
            stackable: false,
            category: "Real Estate"
        }
    ],
    "Vehicles": [
        {
            id: "sedan",
            name: "Reliable Sedan",
            description: "A standard, dependable car for daily driving.",
            price: 20000,
            type: "vehicle",
            stackable: false,
            category: "Vehicles"
        },
        {
            id: "sports_car",
            name: "Sleek Sports Car",
            description: "A fast and stylish car that will turn heads.",
            price: 80000,
            type: "vehicle",
            stackable: false,
            category: "Vehicles"
        },
        {
            id: "private_jet",
            name: "Private Jet",
            description: "Travel the world in ultimate luxury and style.",
            price: 5000000,
            type: "vehicle",
            stackable: false,
            category: "Vehicles"
        },
        {
            id: "motorcycle",
            name: "Motorcycle",
            description: "Fast, thrilling, and perfect for risky getaways.",
            price: 15000,
            type: "vehicle",
            stackable: false,
            category: "Vehicles"
        },
        {
            id: "yacht",
            name: "Luxury Yacht",
            description: "Party on the water. Boosts flex level by 100%.",
            price: 2500000,
            type: "vehicle",
            stackable: false,
            category: "Vehicles"
        }
    ],
    "Consumables": [
        {
            id: "xp_boost",
            name: "XP Boost",
            description: "Doubles your XP gain for 1 hour.",
            price: 5000,
            type: "consumable",
            stackable: true,
            category: "Consumables"
        },
        {
            id: "luck_potion",
            name: "Potion of Luck",
            description: "Increases your chances in gamble and lootbox by 10% for 1 hour.",
            price: 7500,
            type: "consumable",
            stackable: true,
            category: "Consumables"
        },
        {
            id: "energy_drink",
            name: "Energy Drink",
            description: "Reduces work cooldown by 50% for 30 minutes.",
            price: 3000,
            type: "consumable",
            stackable: true,
            category: "Consumables"
        },
        {
            id: "anti_rob_shield",
            name: "Anti-Rob Shield",
            description: "Prevents one robbery attempt for 24 hours.",
            price: 10000,
            type: "consumable",
            stackable: true,
            category: "Consumables"
        }
    ],
    "Lootboxes": [
        {
            id: "common",
            name: "Common Lootbox",
            description: "A common lootbox with a chance for cash or items.",
            price: 1000,
            type: "lootbox",
            stackable: true,
            category: "Lootboxes"
        },
        {
            id: "rare",
            name: "Rare Lootbox",
            description: "A rare lootbox with a higher chance for valuable rewards.",
            price: 5000,
            type: "lootbox",
            stackable: true,
            category: "Lootboxes"
        },
        {
            id: "epic",
            name: "Epic Lootbox",
            description: "Contains rare items, high cash rewards, or XP boosts.",
            price: 15000,
            type: "lootbox",
            stackable: true,
            category: "Lootboxes"
        },
        {
            id: "legendary",
            name: "Legendary Lootbox",
            description: "Big money, rare items, or maybe even a property!",
            price: 50000,
            type: "lootbox",
            stackable: true,
            category: "Lootboxes"
        }
    ],
    "Upgrades": [
        {
            id: "vault_upgrade",
            name: "Bank Vault Upgrade",
            description: "Increases your bank limit by 25%.",
            price: 20000,
            type: "upgrade",
            stackable: false,
            category: "Upgrades"
        },
        {
            id: "safehouse",
            name: "Safe House",
            description: "Decreases chances of being robbed.",
            price: 100000,
            type: "upgrade",
            stackable: false,
            category: "Upgrades"
        }
    ],
    ...petShopItems
};

module.exports = { shopItems };