require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { router: authRoutes } = require('./routes/auth');
const marketRoutes = require('./routes/market');
const blocksRoutes = require('./routes/blocks');
const ticketsRoutes = require('./routes/tickets');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Database Setup Function (不删除已有数据) ---
const setupDatabase = async () => {
  console.log('--- Starting Database Setup ---');
  try {
    // 只创建不存在的表，不删除已有数据
    // 如果需要重置，手动运行 DROP TABLE 命令

    // --- Create Tables ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        nonce TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured "users" table exists.');

    await db.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date VARCHAR(100),
        location VARCHAR(255),
        price VARCHAR(100),
        description TEXT
      );
    `);
    console.log('Ensured "events" table exists.');

    await db.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id),
        owner_address VARCHAR(42) NOT NULL
      );
    `);
    console.log('Ensured "tickets" table exists.');

    await db.query(`
      CREATE TABLE IF NOT EXISTS sell_orders (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id),
        seller_address VARCHAR(42) NOT NULL,
        price NUMERIC(18, 6) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured "sell_orders" table exists.');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS buy_orders (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id),
        buyer_address VARCHAR(42) NOT NULL,
        price NUMERIC(18, 6) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured "buy_orders" table exists.');

    // 新增：用户起始区块表（用于精准查询链上事件）
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_start_blocks (
        wallet_address VARCHAR(42) PRIMARY KEY,
        start_block BIGINT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured "user_start_blocks" table exists.');

    // 新增：NFT 门票交易记录表（缓存购票信息）
    await db.query(`
      CREATE TABLE IF NOT EXISTS nft_tickets (
        id SERIAL PRIMARY KEY,
        token_id BIGINT NOT NULL UNIQUE,
        occasion_id INTEGER NOT NULL,
        seat_number INTEGER NOT NULL,
        owner_address VARCHAR(42) NOT NULL,
        tx_hash VARCHAR(66) NOT NULL,
        block_number BIGINT NOT NULL,
        is_checked_in BOOLEAN DEFAULT FALSE,
        has_claimed_poap BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured "nft_tickets" table exists.');

    // 新增：POAP 领取记录表
    await db.query(`
      CREATE TABLE IF NOT EXISTS poap_claims (
        id SERIAL PRIMARY KEY,
        token_id BIGINT NOT NULL,
        occasion_id INTEGER NOT NULL,
        claimer_address VARCHAR(42) NOT NULL,
        tx_hash VARCHAR(66) NOT NULL,
        block_number BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(token_id, occasion_id)
      );
    `);
    console.log('Ensured "poap_claims" table exists.');

    // 新增：检票记录表
    await db.query(`
      CREATE TABLE IF NOT EXISTS checkin_records (
        id SERIAL PRIMARY KEY,
        token_id BIGINT NOT NULL UNIQUE,
        occasion_id INTEGER NOT NULL,
        tx_hash VARCHAR(66) NOT NULL,
        block_number BIGINT NOT NULL,
        checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured "checkin_records" table exists.');

    // --- Seed Data (只在表为空时插入) ---
    const eventCount = await db.query('SELECT COUNT(*) FROM events');
    if (parseInt(eventCount.rows[0].count) === 0) {
      const eventsToSeed = [
        { id: 1, name: 'ETH Global Conference', date: '2025-12-01', location: 'Online', price: '100' },
        { id: 2, name: 'Decentralized Art Show', date: '2025-12-15', location: 'Metaverse Gallery', price: '50' },
        { id: 3, name: 'Web3 Music Festival', date: '2026-01-10', location: 'Miami, FL', price: '200' }
      ];
      for (const event of eventsToSeed) {
        await db.query('INSERT INTO events(id, name, date, location, price) VALUES($1, $2, $3, $4, $5)', [event.id, event.name, event.date, event.location, event.price]);
      }
      console.log('Seeded "events" table.');
    } else {
      console.log('Events table already has data, skipping seed.');
    }

    console.log('--- Database Setup Complete ---');

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
  app.use('/api/blocks', blocksRoutes);
  app.use('/api/tickets', ticketsRoutes);
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
setupDatabase().then(() => {
  startServer();
});