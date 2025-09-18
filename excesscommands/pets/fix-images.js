const { Pet } = require('../../models/pets/pets');
const allPetsData = require('../../data/pets');
const { PermissionsBitField } = require('discord.js');

// Create a map for quick lookups
const petDataMap = new Map(allPetsData.map(p => [p.species, p]));

module.exports = {
    name: 'fix-images',
    description: 'One-time command to update all existing pets with their correct image URLs.',
    async execute(message) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('You do not have permission to use this command.');
        }

        console.log('Starting image fix process...');
        const updatePromises = [];
        let petsFound = 0;
        let petsUpdated = 0;

        try {
            const cursor = Pet.find({ image: { $exists: false } }).cursor();
            console.log('Created cursor to find pets with no image.');

            for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
                petsFound++;
                console.log(`Found pet: ${doc.name} (Species: ${doc.species})`);
                const petInfo = petDataMap.get(doc.species);

                if (petInfo && petInfo.image) {
                    console.log(`  > Found matching image URL: ${petInfo.image}`);
                    doc.image = petInfo.image;
                    updatePromises.push(doc.save());
                    petsUpdated++;
                } else {
                    console.log(`  > Could not find image for species: ${doc.species}`);
                }
            }

            await Promise.all(updatePromises);
            console.log(`
Finished processing.
- Pets found without images: ${petsFound}
- Pets successfully updated: ${petsUpdated}
`);

            await message.reply(`Image update process complete. Found ${petsFound} pets missing images and successfully updated ${petsUpdated}.`);

        } catch (error) {
            console.error('An error occurred during the image fix process:', error);
            await message.reply('An error occurred. Please check the logs for more details.');
        }
    },
};