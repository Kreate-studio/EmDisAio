const { hentaiCommandCollection, serverConfigCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const DisabledCommand = require('../models/commands/DisabledCommands');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        let serverConfig;
        try {
            serverConfig = await serverConfigCollection.findOne({ serverId: message.guild.id });
        } catch (err) {
            console.error('Error fetching server configuration from MongoDB:', err);
        }

        const prefix = serverConfig?.prefix || config.prefix;
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const excessCommandsPath = path.join(__dirname, '..', 'excesscommands');
        let command;
        let finalArgs = args;
        let effectiveCommandName = commandName;

        if (commandName === 'pet' && config.excessCommands.pets) {
            const subCommandName = (args.length > 0 ? args.shift().toLowerCase() : 'help');
            const commandPath = path.join(excessCommandsPath, 'pets', `${subCommandName}.js`);

            if (fs.existsSync(commandPath)) {
                command = require(commandPath);
                effectiveCommandName = `${commandName} ${subCommandName}`;
            }
        } else {
            const commandFolders = fs.readdirSync(excessCommandsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            for (const folder of commandFolders) {
                const commandPath = path.join(excessCommandsPath, folder, `${commandName}.js`);
                if (fs.existsSync(commandPath)) {
                    if (folder === 'hentai') {
                        const hentaiSettings = await hentaiCommandCollection.findOne({ serverId: message.guild.id });
                        if (!hentaiSettings?.status) {
                            return message.reply('Hentai commands are currently disabled.');
                        }
                    }

                    if (config.excessCommands[folder]) {
                        command = require(commandPath);
                        break;
                    }
                }
            }
        }

        if (!command) return;

        try {
            const isDisabled = await DisabledCommand.findOne({ guildId: message.guild.id, commandName: command.name });
            const isGroupDisabled = (commandName === 'pet') ? await DisabledCommand.findOne({ guildId: message.guild.id, commandName: 'pet' }) : null;

            if (isDisabled || isGroupDisabled) {
                const disabledName = isGroupDisabled ? 'pet' : command.name;
                return message.reply(`❌ The \`'${prefix}${disabledName}\`' command is disabled in this server.`);
            }

            await command.execute(message, finalArgs, client);
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Command Error')
                .setDescription(`An error occurred while executing the \`'${effectiveCommandName}\`' command.`)
                .addFields({ name: 'Error Details:', value: error.message });
            message.reply({ embeds: [errorEmbed] });
        }
    }
};
