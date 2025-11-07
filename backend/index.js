require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { router: authRoutes } = require('./routes/auth');
const marketRoutes = require('./routes/market');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Database Reset and Seed Function ---
const resetAndSeedDatabase = async () => {
  console.log('--- Starting Database Reset ---');
  try {
    // Drop existing tables to ensure a clean state
    await db.query('DROP TABLE IF EXISTS events, users, tickets, sell_orders, buy_orders CASCADE;');
    console.log('Dropped existing tables.');

    // --- Create Tables ---
    await db.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        nonce TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "users" table.');

    await db.query(`
      CREATE TABLE events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date VARCHAR(100),
        location VARCHAR(255),
        price VARCHAR(100),
        description TEXT
      );
    `);
    console.log('Created "events" table.');

    await db.query(`
      CREATE TABLE tickets (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id),
        owner_address VARCHAR(42) NOT NULL
      );
    `);
    console.log('Created "tickets" table.');

    await db.query(`
      CREATE TABLE sell_orders (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id),
        seller_address VARCHAR(42) NOT NULL,
        price NUMERIC(18, 6) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "sell_orders" table.');
    
    await db.query(`
      CREATE TABLE buy_orders (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id),
        buyer_address VARCHAR(42) NOT NULL,
        price NUMERIC(18, 6) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created "buy_orders" table.');

    // --- Seed Data ---
    const eventsToSeed = [
      { id: 1, name: 'ETH Global Conference', date: '2025-12-01', location: 'Online', price: '100' },
      { id: 2, name: 'Decentralized Art Show', date: '2025-12-15', location: 'Metaverse Gallery', price: '50' },
      { id: 3, name: 'Web3 Music Festival', date: '2026-01-10', location: 'Miami, FL', price: '200' }
    ];
    for (const event of eventsToSeed) {
      await db.query('INSERT INTO events(id, name, date, location, price) VALUES($1, $2, $3, $4, $5)', [event.id, event.name, event.date, event.location, event.price]);
    }
    console.log('Seeded "events" table.');

    console.log('--- Database Reset Complete ---');

  } catch (error) {
    console.error('FATAL: Database reset failed:', error);
    process.exit(1); // Exit if DB setup fails
  }
};


// --- Express App Setup ---
const startServer = async () => {
  // Middleware
  app.use(cors({ origin: 'http://localhost:3000' }));
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/market', marketRoutes);
  app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/api/events', async (req, res) => {
    try {
      const { rows } = await db.query('SELECT * FROM events ORDER BY id');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

// --- Main Execution ---
resetAndSeedDatabase().then(() => {
  startServer();
});