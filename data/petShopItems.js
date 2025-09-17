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
            image: 'https://i.ibb.co/JRxNwMfD/cegg.png',
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
            image: 'https://i.ibb.co/zTBSM8F2/eegg.png',
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
            image: 'https://i.ibb.co/8LCMVmYp/epic-egg.png',
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
            image: 'https://i.ibb.co/8LRHhrDG/legegg.png',
            category: 'Pet Eggs',
            type: 'egg',
            stackable: true
        },
        {
            id: 'mythic_egg',
            name: 'Mythic Egg',
            price: 5000,
            rarity: 'Mythic',
            description: 'A powerful and extremely rare egg. Only the luckiest adventurers will ever see one.',
            image: 'https://i.ibb.co/LXNdBrtH/mythegg.png',
            category: 'Pet Eggs',
            type: 'egg',
            stackable: true
        },
        {
            id: 'exclusive_egg',
            name: 'Exclusive Egg',
            price: 10000,
            rarity: 'Exclusive',
            description: 'An egg of unbelievable rarity. It is said to contain a pet found nowhere else.',
            image: 'https://i.ibb.co/JZz128M/exeggg.png',
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