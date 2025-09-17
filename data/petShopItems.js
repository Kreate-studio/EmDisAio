const pets = require('./pets');

module.exports = {
    "Pets": pets,
    "Pet Eggs": [
        {
            id: 'common_egg',
            name: 'Common Egg',
            price: 100,
            rarity: 'Common',
            description: 'A plain-looking egg that seems to be quite common. Who knows what might hatch from it?',
            image: 'https://i.imgur.com/yGkFM8S.png',
            category: 'Pet Eggs',
            type: 'egg',
            stackable: true
        },
        {
            id: 'uncommon_egg',
            name: 'Uncommon Egg',
            price: 250,
            rarity: 'Uncommon',
            description: 'An egg with some unusual markings. It feels slightly warmer than a common egg.',
            image: 'https://i.imgur.com/2yKzcrj.png',
            category: 'Pet Eggs',
            type: 'egg',
            stackable: true
        },
        {
            id: 'rare_egg',
            name: 'Rare Egg',
            price: 500,
            rarity: 'Rare',
            description: 'A beautifully patterned egg that glows with a faint light. It feels special to the touch.',
            image: 'https://i.imgur.com/J1A2vSS.png',
            category: 'Pet Eggs',
            type: 'egg',
            stackable: true
        },
        {
            id: 'epic_egg',
            name: 'Epic Egg',
            price: 1000,
            rarity: 'Epic',
            description: 'An egg that seems to hum with a powerful energy. It is adorned with intricate, glowing patterns.',
            image: 'https://i.imgur.com/pYdKj7A.png',
            category: 'Pet Eggs',
            type: 'egg',
            stackable: true
        },
        {
            id: 'legendary_egg',
            name: 'Legendary Egg',
            price: 2500,
            rarity: 'Legendary',
            description: 'A magnificent egg that radiates a powerful aura. Holding it fills you with a sense of awe and wonder.',
            image: 'https://i.imgur.com/cKgs9d1.png',
            category: 'Pet Eggs',
            type: 'egg',
            stackable: true
        }
    ],
    "Pet Supplies": [
        {
            id: 'pet_food',
            name: 'Pet Food',
            price: 50,
            description: 'A bag of nutritious pet food that will keep your pet healthy and happy.',
            image: 'https://i.imgur.com/1j4tY3J.png',
            category: 'Pet Supplies',
            type: 'consumable',
            stackable: true
        }
    ]
};