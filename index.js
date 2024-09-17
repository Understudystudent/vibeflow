// Load environment variables from a .env file
require('dotenv').config();

// Import the required modules
const express = require('express');
const Shopify = require('shopify-web-api-node');

// Initialize the Express application
const app = express();

// Set the port number
const port = 3050;

// Initialize Shopify API client
const shopify = new Shopify({
  shopName: process.env.SHOP_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN
});

// Define a route for testing
app.get('/login', (req, res) => {
    const scopes = ['read_products', 'write_products', 'read_orders', 'write_orders'];
    const shop = process.env.SHOP_NAME;
    const redirectUri = process.env.REDIRECT_URI;
    const state = 'random-state'; // Use a proper state parameter for security
    const url = shopify.buildAuthURL(scopes, redirectUri, state);
    res.redirect(url);
});

// Define a route to handle the callback from Shopify
app.get('/callback', async (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error('Error:', error);
        return res.status(400).send(`Error: ${error}`);
    }

    try {
        const { access_token } = await shopify.getAccessToken(code);
        res.send(`Access token: ${access_token}`);
    } catch (error) {
        console.error('Failed to get access token:', error);
        res.status(500).send('Failed to get access token');
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
