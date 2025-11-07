const express = require('express');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

// Middleware to authenticate the token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const generateMessageToSign = (nonce) => {
    return `Sign this message to log into NFT Ticket Marketplace. Nonce: ${nonce}`;
};

// Generate a nonce for a given wallet address
router.post('/nonce', async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return res.status(400).json({ error: 'A valid walletAddress is required' });
  }

  try {
    const lowerCaseAddress = walletAddress.toLowerCase();

    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE wallet_address = $1', [lowerCaseAddress]);
    const userExists = userResult.rows.length > 0;

    if (!userExists) {
      console.log(`New user detected: ${lowerCaseAddress}. Creating user and granting ticket...`);
      // Create the user first
      await db.query('INSERT INTO users(wallet_address) VALUES($1)', [lowerCaseAddress]);
      // Grant a free ticket for Event 1 to the new user
      await db.query('INSERT INTO tickets(event_id, owner_address) VALUES (1, $1)', [lowerCaseAddress]);
      console.log(`Granted a free ticket for Event 1 to new user: ${lowerCaseAddress}`);
    }

    // Now, generate and save a new nonce for the user (new or existing)
    const nonce = crypto.randomBytes(32).toString('hex');
    await db.query('UPDATE users SET nonce = $1 WHERE wallet_address = $2', [nonce, lowerCaseAddress]);
    
    const message = generateMessageToSign(nonce);

    res.json({ message });
  } catch (error) {
      console.error('Error in /nonce endpoint:', error);
      res.status(500).json({ error: 'Server error while generating nonce.' });
  }
});

// Verify the signature and log the user in
router.post('/verify', async (req, res) => {
  const { walletAddress, signature } = req.body;
  console.log('\n--- [/verify] Received Request ---');
  console.log('Wallet Address:', walletAddress);
  console.log('Signature:', signature);

  if (!walletAddress || !signature) {
    console.log('Result: Failed (Missing parameters)');
    return res.status(400).json({ error: 'Missing walletAddress or signature.' });
  }

  try {
    // 1. Get user and their stored nonce from DB
    const userResult = await db.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress.toLowerCase()]);
    const user = userResult.rows[0];
    console.log('Step 1.1: Checking for existing user. Found:', !!user);

    if (!user || !user.nonce) {
      console.log('Result: Failed (User or nonce not found in DB)');
      return res.status(404).json({ error: 'User not found or no nonce available. Please request a new nonce.' });
    }

    // 2. Recreate the exact message that was signed
    const message = generateMessageToSign(user.nonce);
    console.log('Step 2: Reconstructed message for verification:\n', `"${message}"`);
    
    // 3. Verify the signature
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
      console.log('Step 3: Successfully recovered address:', recoveredAddress);
    } catch (e) {
      console.error('CRITICAL: ethers.verifyMessage failed!', e);
      console.log('Result: Failed (Signature verification threw an error)');
      return res.status(401).json({ error: 'Signature verification failed internally.' });
    }

    // 4. Compare addresses
    const isMatch = recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    console.log(`Step 4: Comparing addresses -> Recovered: ${recoveredAddress.toLowerCase()} | Provided: ${walletAddress.toLowerCase()} | Match: ${isMatch}`);

    if (!isMatch) {
      console.log('Result: Failed (Addresses do not match)');
      return res.status(401).json({ error: 'Invalid signature.' });
    }

    // 5. Signature is valid, immediately update the nonce to prevent replay attacks
    console.log('Step 5: Signature is valid. Resetting nonce in DB...');
    const newNonce = crypto.randomBytes(32).toString('hex');
    await db.query('UPDATE users SET nonce = $1 WHERE wallet_address = $2', [newNonce, walletAddress.toLowerCase()]);

    // 6. Create a JWT token
    console.log('Step 6: Creating JWT...');
    const token = jwt.sign({ id: user.id, address: user.wallet_address }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return only non-sensitive user info
    const userInfo = { id: user.id, wallet_address: user.wallet_address };
    console.log('Result: Success! Sending JWT.');
    res.json({ token, user: userInfo });

  } catch (error) {
    console.error('Error during verification:', error);
    res.status(500).json({ error: 'Server error during verification.' });
  }
});

// Get user profile from token
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query('SELECT id, wallet_address FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = { router, authenticateToken };
