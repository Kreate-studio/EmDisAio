const axios = require('axios');
const dotenv = require('dotenv');
const colors = require('./UI/colors/colors');
const client = require('./main');
dotenv.config();
const { PermissionsBitField } = require('discord.js');
const API_BASE_URL = process.env.API_BASE_URL || 'http://0.0.0.0:10000/api';
let serverOnline = true;

async function checkServerStatus() {
    try {
        const response = await axios.get(`${API_BASE_URL}/server-status`);
        serverOnline = response.data.serverOnline;
        
        if (serverOnline) {
            console.log('\n' + '─'.repeat(40));
            console.log(`${colors.magenta}${colors.bright}🔗  API SERVICES${colors.reset}`);
            console.log('─'.repeat(40));
            console.log(`${colors.cyan}[ SERVER ]${colors.reset} ${colors.green}Connected to backend server ✅${colors.reset}`);
            console.log(`${colors.cyan}[ STATUS ]${colors.reset} ${colors.green}Service Online 🌐${colors.reset}`);
        } else {
            console.log(`${colors.yellow}[ SERVER ]${colors.reset} ${colors.red}Server is offline ❌${colors.reset}`);
        }
        
    } catch (error) {
        console.log(`${colors.yellow}[ WARNING ]${colors.reset} ${colors.red}Failed to connect to server ⚠️${colors.reset}`);
        serverOnline = false;
    }
}

checkServerStatus();

const BOT_TOKEN = process.env.TOKEN;
const BOT_API = process.env.BOT_API;

// // A function to validate the API key with the middleware
// async function validateBotAPIKey() {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/api/validate-bot`, {
//       botId: client.user ? client.user.id : null,
//       userId: process.env.DISCORD_USER_ID,
//       apiKey: BOT_API,
//     });
//     if (response.data.valid) {
//       console.log('✅ API key validated.');
//       return true;
//     } else {
//       console.error('❌ Invalid API key or already in use.');
//       process.exit(1); // Terminate this bot instance
//     }
//   } catch (error) {
//     console.error('❌ Error validating API key:', error);
//     process.exit(1);
//   }
// }

// client.once('ready', async () => {
//   console.log('Bot is ready!');
//   // Validate the API key first
//   if (!(await validateBotAPIKey())) return;
  
//   // Continue with your existing logic – sending server data, etc.
//   try {
//     const guilds = await Promise.all(client.guilds.cache.map(async guild => {
//       try {
//         const member = await guild.members.fetch(process.env.DISCORD_USER_ID);
//         const hasAdminRole = member.roles.cache.some(role =>
//           role.permissions.has(PermissionsBitField.Flags.Administrator)
//         );
//         return {
//           id: guild.id,
//           name: guild.name,
//           icon: guild.iconURL(),
//           roles: member.roles.cache.map(role => ({
//             name: role.name,
//             hasAdmin: role.permissions.has(PermissionsBitField.Flags.Administrator)
//           })),
//           hasAdmin: hasAdminRole
//         };
//       } catch (error) {
//         if (error.code === 10007) {
//           console.warn(`Member not found in guild ${guild.id}, skipping.`);
//           return null;
//         } else {
//           throw error;
//         }
//       }
//     }));
//     const validGuilds = guilds.filter(guild => guild !== null);
//     const payload = {
//       botId: client.user.id,
//       userId: process.env.DISCORD_USER_ID,
//       servers: validGuilds
//     };
//     await axios.post(`${API_BASE_URL}/api/bot-servers`, payload);
//     console.log('✅ Sent server list to backend.');
//   } catch (error) {
//     console.error('❌ Error sending server list:', error);
//   }
// });
// client.login(BOT_TOKEN);

module.exports = {
    isServerOnline: function() {
        return serverOnline;
    }
};