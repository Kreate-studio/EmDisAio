<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ALL IN ONE BOT 1.2.2</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      background: #000;
      color: #fff;
      background-image: url('https://i.imgur.com/ECZKmlO.gif');
      background-size: cover;
      background-attachment: fixed;
    }

    h1 {
      color: #FF6F61;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      font-size: 3em;
      margin-top: 50px;
      text-align: center;
    }

    p {
      text-align: center;
      margin-top: 20px;
    }

    a {
      text-decoration: none;
      color: white;
      padding: 10px 20px;
      margin: 0 10px;
      border-radius: 30px;
      background: rgba(0, 0, 0, 0.5);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      transition: background 0.3s ease, transform 0.3s ease;
    }

    a:hover {
      background: rgba(0, 0, 0, 0.7);
      transform: translateY(-5px);
    }

    a img {
      vertical-align: middle;
      margin-right: 10px;
    }

    h2, h3 {
      text-align: center;
      font-size: 2em;
      margin-top: 50px;
      color: #FF6F61;
      text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
    }

    h4 {
      font-size: 1.5em;
      color: #FF6F61;
      text-align: center;
      margin-top: 30px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    ol, ul {
      margin: 20px auto;
      max-width: 800px;
      padding-left: 20px;
      font-size: 1.2em;
    }

    pre {
      background-color: #222;
      color: #ddd;
      padding: 15px;
      border-radius: 10px;
      font-family: 'Courier New', Courier, monospace;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    code {
      background-color: #333;
      color: #FF6F61;
      padding: 2px 5px;
      border-radius: 5px;
    }

    footer {
      background-color: #333;
      color: #fff;
      padding: 20px;
      text-align: center;
      font-size: 1.1em;
    }

    footer a {
      color: #FF6F61;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <h1>ALL IN ONE BOT 1.2.2</h1>

  <p>
    <a href="https://opensource.org/licenses/MIT">
      <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square&logo=opensource" alt="License: MIT" />
    </a>
    <a href="https://www.paypal.me/@GlaceYT">
      <img src="https://img.shields.io/badge/Donate-PayPal-0079C1?style=flat-square&logo=paypal" alt="Donate" />
    </a>
  </p>

  <p>
    <a href="https://www.youtube.com/channel/@GlaceYT">
      <img src="https://img.shields.io/badge/YouTube-Subscribe-red?style=flat-square&logo=youtube" alt="YouTube" />
    </a>
    <a href="https://discord.gg/xQF9f9yUEM">
      <img src="https://img.shields.io/badge/Discord-Join-blue?style=flat-square&logo=discord" alt="Join Discord" />
    </a>
    <a href="https://www.instagram.com/glaceytt">
      <img src="https://img.shields.io/badge/Instagram-Follow-E4405F?style=flat-square&logo=instagram" alt="Instagram" />
    </a>
    <a href="https://www.facebook.com/youulewd/">
      <img src="https://img.shields.io/badge/Facebook-Follow-1877F2?style=flat-square&logo=facebook" alt="Facebook" />
    </a>
  </p>

  <h2>Discord All-in-One BOT Installation Guide</h2>

  <h3>How to Install</h3>

  <h4>Step 1: Update <code>config.json</code> [ USE ENV FILES ]</h4>
  <ol>
    <li>Open the <code>config.json</code> and add your MongoDB URL.</li>
  </ol>

  <h4>ENV SETUP</h4>
  <pre>
TOKEN=, 
FACEBOOK_ACCESS_TOKEN=, 
FORTNITE_API_KEY=, 
YOUTUBE_API_KEY=, 
TWITCH_CLIENT_ID=, 
TWITCH_ACCESS_TOKEN=, 
INSTAGRAM_ACCESS_TOKEN=, 
MONGODB_URI=
GEMINI_API=
  </pre>

  <h4>Step 2: Set Up Hosting Service</h4>
  <ol>
    <li>Go to your preferred hosting service. For this guide, we use <a href="https://render.com/">Render</a>.</li>
    <li>In the Build & Deploy section, paste your repository URL.</li>
  </ol>

  <h4>Step 3: Add Build and Start Commands</h4>
  <pre>
Run the following commands to install dependencies and start your bot:

npm install
node index.js
  </pre>

  <h4>Step 4: Get Your Bot Token</h4>
  <ol>
    <li>Navigate to the Discord Developer Portal.</li>
    <li>Find your application, and retrieve the bot token from the "Bot" section.</li>
  </ol>

  <h4>Step 5: Set Environment Variable</h4>
  <ol>
    <li>Create an environment variable with the following details:</li>
    <ul>
      <li>Key: TOKEN</li>
      <li>Value: [your bot token]</li>
    </ul>
    <li>Deploy your application using your hosting service’s deployment process.</li>
  </ol>

  <h4>Step 6: Wait and Test</h4>
  <ol>
    <li>Wait approximately five minutes for your bot to deploy and start up.</li>
    <li>Test your bot by sending commands to ensure it is operational.</li>
  </ol>

  <p>🎉 Congratulations! Your bot is now up and running. 🥳</p>

  <h3>Additional Resources</h3>
  <p><strong>Video Tutorial:</strong> If you prefer a video guide, watch this YouTube tutorial [ Soon ].</p>
  <p><strong>Common Errors:</strong> Consult the errors section for troubleshooting.</p>

  <h3>Useful Files</h3>
  <ul>
    <li><code>UI/banners/musicard.js</code>: Change, add, or remove music cards here.</li>
    <li><code>UI/icons/musicicons.js</code>: Change, add, or remove music icons here.</li>
  </ul>

  <footer>
    <p>Built with ❤️ by GlaceYT. <a href="https://discord.gg/xQF9f9yUEM">Join our community</a> for more support.</p>
  </footer>

</body>
</html>
