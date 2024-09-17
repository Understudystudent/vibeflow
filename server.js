require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize the Express application
const app = express();
const port = 3050;

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URL  
});

// Serve static files from the "public" directory
app.use(express.static('public'));

// Define routes for Spotify authentication
app.get('/login', (req, res) => {
    const scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'];
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', async (req, res) => {
    const error = req.query.error;
    const code = req.query.code;

    if (error) {
        console.error('Error:', error);
        return res.send(`Error: ${error}`);
    }

    console.log('Authorization code:', code); // Debug line

    if (!code) {
        return res.send('Authorization code is missing.');
    }

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];
        const expiresIn = data.body['expires_in'];

        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        console.log(accessToken, refreshToken);

        // Redirect to the main page after successful authentication
        res.redirect('/');
        
        setInterval(async () => {
            try {
                const data = await spotifyApi.refreshAccessToken();
                const accessTokenRefreshed = data.body['access_token'];
                spotifyApi.setAccessToken(accessTokenRefreshed);
                console.log('Access token refreshed.');
            } catch (err) {
                console.error('Error refreshing access token:', err);
            }
        }, (expiresIn / 2) * 1000);
    } catch (error) {
        console.error('Error getting token:', error);
        res.send('Error getting token');
    }
});

// Define a route to search for tracks
app.get('/search', async (req, res) => {
    const { q } = req.query;

    try {
        const data = await spotifyApi.searchTracks(q);
        if (data.body.tracks.items.length > 0) {
            const trackUri = data.body.tracks.items[0].uri;
            res.send({ uri: trackUri });
        } else {
            res.send('No tracks found.');
        }
    } catch (err) {
        console.error('Error searching:', err);
        res.send(`Error searching: ${err.message}`);
    }
});

// Define a route to play a track
app.get('/play', async (req, res) => {
    const { uri } = req.query;

    try {
        await spotifyApi.play({ uris: [uri] });
        res.send('Playback started');
    } catch (err) {
        console.error('Error playing:', err);
        res.send(`Error playing: ${err.message}`);
    }
});

// Define a route to get the current playing track's image
app.get('/current-playing', async (req, res) => {
    try {
        const data = await spotifyApi.getMyCurrentPlayingTrack();
        const currentlyPlaying = data.body;

        if (currentlyPlaying && currentlyPlaying.item) {
            const imageUrl = currentlyPlaying.item.album.images[0].url;
            res.send({ imageUrl });
        } else {
            res.send('No track is currently playing.');
        }
    } catch (err) {
        console.error('Error getting current playing track:', err);
        res.send(`Error getting current playing track: ${err.message}`);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
