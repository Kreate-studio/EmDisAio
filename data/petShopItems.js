const pets = require('./pets');

module.exports = {
    "Pets": pets,
    "Pet Eggs": [
        {
            id: 'common_egg',
            name: 'Common Egg',
            price: 5,
            currency: 'gold',
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
            price: 10,
            currency: 'gold',
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
            price: 15,
            currency: 'gold',
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
            price: 20,
            currency: 'gold',
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
            price: 25,
            currency: 'gold',
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
            price: null,
            currency: 'gold',
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
            price: 1,
            currency: 'gold',
            description: 'A bag of nutritious pet food that will keep your pet healthy and happy.',
            image: 'https://i.imgur.com/1j4tY3J.png',
            category: 'Pet Supplies',
            type: 'consumable',
            stackable: true
        }
    ],
    "Pet Toys": [
        {
            id: 'toy_mouse',
            name: 'Toy Mouse',
            price: 2,
            currency: 'gold',
            description: 'A classic toy mouse that will keep your pet entertained for hours.',
            image: 'https://i.ibb.co/5hKm5bV/toy-mouse.png',
            category: 'Pet Toys',
            type: 'consumable',
            stackable: true
        },
        {
            id: 'feather_wand',
            name: 'Feather Wand',
            price: 3,
            currency: 'gold',
            description: 'A fun and interactive feather wand that your pet will love to chase.',
            image: 'https://i.ibb.co/tYHk0Vj/feather-wand.png',
            category: 'Pet Toys',
            type: 'consumable',
            stackable: true
        },
        {
            id: 'laser_pointer',
            name: 'Laser Pointer',
            price: 4,
            currency: 'gold',
            description: 'A laser pointer that will drive your pet wild with excitement.',
            image: 'https://i.ibb.co/mSgM2vM/laser-pointer.png',
            category: 'Pet Toys',
            type: 'consumable',
            stackable: true
        }
    ]
};