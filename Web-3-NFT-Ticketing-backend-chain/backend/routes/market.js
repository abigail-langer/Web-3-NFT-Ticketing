const express = require('express');
const db = require('../db');
const { authenticateToken } = require('./auth'); // Assuming authenticateToken is exported from auth.js

const router = express.Router();

// --- Matching Engine ---
// This is a simplified matching engine. In a real-world scenario, this would be a more robust service.
const findAndExecuteMatch = async (order, orderType) => {
  let match;
  try {
    if (orderType === 'sell') {
      // A new sell order was created. Look for the best buy order (highest price) that matches.
      const { ticket_id, price: sellPrice } = order;
      const ticket = (await db.query('SELECT event_id FROM tickets WHERE id = $1', [ticket_id])).rows[0];
      if (!ticket) return; // Should not happen

      const result = await db.query(
        `SELECT * FROM buy_orders 
         WHERE event_id = $1 AND status = 'active' AND price >= $2
         ORDER BY price DESC, created_at ASC 
         LIMIT 1`,
        [ticket.event_id, sellPrice]
      );
      match = result.rows[0];
      if (match) {
        console.log(`Found a match! Sell Order for ticket ${ticket_id} matched with Buy Order ${match.id}`);
        // Execute the trade
        await db.query('BEGIN');
        // Update ticket owner
        await db.query('UPDATE tickets SET owner_address = $1 WHERE id = $2', [match.buyer_address, ticket_id]);
        // Mark orders as filled using their specific IDs
        await db.query("UPDATE sell_orders SET status = 'filled' WHERE id = $1", [order.id]);
        await db.query("UPDATE buy_orders SET status = 'filled' WHERE id = $1", [match.id]);
        await db.query('COMMIT');
        console.log(`Trade executed. Ticket ${ticket_id} transferred to ${match.buyer_address}`);
      }
    } else if (orderType === 'buy') {
      // A new buy order was created. Look for the best sell order (lowest price) that matches.
      const { event_id, price: buyPrice } = order;
      const result = await db.query(
        `SELECT * FROM sell_orders
         WHERE ticket_id IN (SELECT id FROM tickets WHERE event_id = $1)
         AND status = 'active' AND price <= $2
         ORDER BY price ASC, created_at ASC
         LIMIT 1`,
        [event_id, buyPrice]
      );
      match = result.rows[0];
      if (match) {
        console.log(`Found a match! Buy Order for event ${event_id} matched with Sell Order ${match.id}`);
        // Execute the trade
        await db.query('BEGIN');
        // Update ticket owner
        await db.query('UPDATE tickets SET owner_address = $1 WHERE id = $2', [order.buyer_address, match.ticket_id]);
        // Mark orders as filled using their specific IDs
        await db.query("UPDATE sell_orders SET status = 'filled' WHERE id = $1", [match.id]);
        await db.query("UPDATE buy_orders SET status = 'filled' WHERE id = $1", [order.id]);
        await db.query('COMMIT');
        console.log(`Trade executed. Ticket ${match.ticket_id} transferred to ${order.buyer_address}`);
      }
    }
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error during matching and execution:', error);
  }
};


// --- API Endpoints ---

// Get all tickets owned by the authenticated user
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const { address } = req.user;
    const { rows } = await db.query('SELECT * FROM tickets WHERE owner_address = $1 ORDER BY id', [address]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get the order book for a specific event
router.get('/orders/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const sellOrders = await db.query("SELECT * FROM sell_orders WHERE ticket_id IN (SELECT id FROM tickets WHERE event_id = $1) AND status = 'active' ORDER BY price ASC", [eventId]);
    const buyOrders = await db.query("SELECT * FROM buy_orders WHERE event_id = $1 AND status = 'active' ORDER BY price DESC", [eventId]);
    res.json({
      sells: sellOrders.rows,
      buys: buyOrders.rows,
    });
  } catch (error) {
    console.error('Error fetching event orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a sell order (list a ticket for sale)
router.post('/sell', authenticateToken, async (req, res) => {
  const { ticketId, price } = req.body;
  const { address: sellerAddress } = req.user;

  if (!ticketId || !price || price <= 0) {
    return res.status(400).json({ error: 'ticketId and a valid price are required.' });
  }

  try {
    // 1. Verify ownership
    const ticketResult = await db.query('SELECT owner_address FROM tickets WHERE id = $1', [ticketId]);
    const ticket = ticketResult.rows[0];
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }
    if (ticket.owner_address !== sellerAddress) {
      return res.status(403).json({ error: 'You do not own this ticket.' });
    }

    // 2. Verify it's not already listed
    const existingOrder = await db.query("SELECT id FROM sell_orders WHERE ticket_id = $1 AND status = 'active'", [ticketId]);
    if (existingOrder.rows.length > 0) {
      return res.status(409).json({ error: 'This ticket is already listed for sale.' });
    }

    // 3. Create the sell order
    const newOrderResult = await db.query(
      'INSERT INTO sell_orders(ticket_id, seller_address, price) VALUES($1, $2, $3) RETURNING *',
      [ticketId, sellerAddress, price]
    );
    const newOrder = newOrderResult.rows[0];
    
    res.status(201).json(newOrder);

    // 4. Try to find a match
    await findAndExecuteMatch(newOrder, 'sell');

  } catch (error) {
    console.error('Error creating sell order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a buy order (place a bid)
router.post('/buy', authenticateToken, async (req, res) => {
  const { eventId, price } = req.body;
  const { address: buyerAddress } = req.user;

  if (!eventId || !price || price <= 0) {
    return res.status(400).json({ error: 'eventId and a valid price are required.' });
  }

  try {
    // Create the buy order
    const newOrderResult = await db.query(
      'INSERT INTO buy_orders(event_id, buyer_address, price) VALUES($1, $2, $3) RETURNING *',
      [eventId, buyerAddress, price]
    );
    const newOrder = newOrderResult.rows[0];

    res.status(201).json(newOrder);

    // Try to find a match
    await findAndExecuteMatch(newOrder, 'buy');

  } catch (error) {
    console.error('Error creating buy order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Execute an "instant buy" by taking an existing sell order
router.post('/execute_sell_order', authenticateToken, async (req, res) => {
    const { sellOrderId } = req.body;
    const { address: buyerAddress } = req.user;

    if (!sellOrderId) {
        return res.status(400).json({ error: 'sellOrderId is required.' });
    }

    try {
        await db.query('BEGIN');

        // 1. Get and lock the sell order
        const orderResult = await db.query("SELECT * FROM sell_orders WHERE id = $1 AND status = 'active' FOR UPDATE", [sellOrderId]);
        const sellOrder = orderResult.rows[0];

        if (!sellOrder) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Active sell order not found.' });
        }

        // 2. Check if buyer is the seller
        if (sellOrder.seller_address === buyerAddress) {
            await db.query('ROLLBACK');
            return res.status(403).json({ error: 'You cannot buy your own ticket.' });
        }

        // In a real app, you would also verify the buyer has enough funds here.

        // 3. Execute the trade
        // Update ticket owner
        await db.query('UPDATE tickets SET owner_address = $1 WHERE id = $2', [buyerAddress, sellOrder.ticket_id]);
        // Mark sell order as filled
        await db.query("UPDATE sell_orders SET status = 'filled' WHERE id = $1", [sellOrder.id]);

        await db.query('COMMIT');

        console.log(`Trade executed via instant buy. Ticket ${sellOrder.ticket_id} transferred to ${buyerAddress}`);
        res.status(200).json({ success: true, message: 'Purchase successful!' });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error executing sell order:', error);
        res.status(500).json({ error: 'Server error during purchase.' });
    }
});

module.exports = router;
