const express = require('express');
const { getEconomyProfile } = require('./models/economy');
const { api } = require('./config.json');

function initializeApi(client) {
  const app = express();
  const PORT = process.env.PORT || api.port || 3000;
  const API_SECRET = process.env.API_SECRET || api.secret;

  if (!API_SECRET) {
    console.warn(
      'API secret is not set. The API will not be secured. Please set api.secret in config.json or the API_SECRET environment variable.'
    );
  }

  // Security Middleware: Checks for the secret API key on every request
  const checkApiKey = (req, res, next) => {
    // Skip API key check if no secret is configured
    if (!API_SECRET) {
      return next();
    }

    const providedKey = req.header('X-API-Secret');
    if (providedKey !== API_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  app.use(express.json()); // Middleware to parse JSON bodies
  app.use(checkApiKey); // Apply the security check to all API routes

  // --- API Endpoint for the Profile ---
  app.get('/api/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await client.users.fetch(userId).catch(() => null);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Fetch user's economy profile using your existing function
      const profileData = await getEconomyProfile(userId);

      // You can augment this with more data if you wish
      const response = {
        userId: profileData.userId,
        username: user.username,
        avatar: user.displayAvatarURL(),
        wallet: profileData.wallet,
        bank: profileData.bank,
        inventory: profileData.inventory,
        // Add other fields from profileData as needed
      };

      res.json(response);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Start the API server
  app.listen(PORT, () => {
    console.log(`Bot API server is running on http://localhost:${PORT}`);
  });
}

module.exports = { initializeApi };
