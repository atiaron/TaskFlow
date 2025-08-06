const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Google OAuth endpoint
router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;
    const redirectUri = 'http://localhost:3000'; // Fixed redirect URI
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    console.log('🔄 Exchanging OAuth code for tokens...');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ Token exchange failed:', error);
      return res.status(400).json({ error: 'Failed to exchange code for token' });
    }

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      return res.status(400).json({ error: 'No access token received' });
    }

    console.log('✅ Got access token, fetching user info...');

    // Get user info with the access token
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokens.access_token}`
    );
    
    if (!userInfoResponse.ok) {
      return res.status(400).json({ error: 'Failed to get user info from Google' });
    }
    
    const userInfo = await userInfoResponse.json();
    console.log('👤 User authenticated:', userInfo.email);
    
    const user = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      settings: {
        theme: 'light',
        language: 'he',
        notifications: true
      }
    };

    res.json({
      user: user,
      accessToken: tokens.access_token
    });

  } catch (error) {
    console.error('❌ OAuth authentication error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

module.exports = router;
