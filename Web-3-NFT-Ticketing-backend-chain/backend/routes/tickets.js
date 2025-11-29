const express = require('express');
const db = require('../db');

const router = express.Router();

// 记录购票交易
router.post('/mint', async (req, res) => {
  const { tokenId, occasionId, seatNumber, ownerAddress, txHash, blockNumber } = req.body;
  
  if (!tokenId || !occasionId || !seatNumber || !ownerAddress || !txHash || !blockNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const lowerAddress = ownerAddress.toLowerCase();
    
    // 检查是否已存在
    const existing = await db.query(
      'SELECT id FROM nft_tickets WHERE token_id = $1',
      [tokenId]
    );

    if (existing.rows.length > 0) {
      return res.json({ message: 'Ticket already recorded', ticketId: existing.rows[0].id });
    }

    // 插入新记录
    const result = await db.query(
      `INSERT INTO nft_tickets(token_id, occasion_id, seat_number, owner_address, tx_hash, block_number) 
       VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
      [tokenId, occasionId, seatNumber, lowerAddress, txHash, blockNumber]
    );
    
    res.status(201).json({ 
      message: 'Ticket recorded successfully', 
      ticketId: result.rows[0].id,
      tokenId,
      txHash
    });
  } catch (error) {
    console.error('Error recording ticket:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取用户的所有门票
router.get('/user/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress is required' });
  }

  try {
    const lowerAddress = walletAddress.toLowerCase();
    const result = await db.query(
      `SELECT 
        token_id, 
        occasion_id, 
        seat_number, 
        owner_address, 
        tx_hash, 
        block_number,
        is_checked_in,
        has_claimed_poap,
        created_at
       FROM nft_tickets 
       WHERE owner_address = $1 
       ORDER BY created_at DESC`,
      [lowerAddress]
    );

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 记录检票
router.post('/checkin', async (req, res) => {
  const { tokenId, occasionId, txHash, blockNumber } = req.body;
  
  if (!tokenId || !occasionId || !txHash || !blockNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 更新门票表
    await db.query(
      'UPDATE nft_tickets SET is_checked_in = TRUE, updated_at = CURRENT_TIMESTAMP WHERE token_id = $1',
      [tokenId]
    );

    // 插入检票记录
    const existing = await db.query(
      'SELECT id FROM checkin_records WHERE token_id = $1',
      [tokenId]
    );

    if (existing.rows.length === 0) {
      await db.query(
        'INSERT INTO checkin_records(token_id, occasion_id, tx_hash, block_number) VALUES($1, $2, $3, $4)',
        [tokenId, occasionId, txHash, blockNumber]
      );
    }
    
    res.json({ message: 'Check-in recorded successfully', tokenId });
  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 记录 POAP 领取
router.post('/claim-poap', async (req, res) => {
  const { tokenId, occasionId, claimerAddress, txHash, blockNumber } = req.body;
  
  if (!tokenId || !occasionId || !claimerAddress || !txHash || !blockNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const lowerAddress = claimerAddress.toLowerCase();

    // 更新门票表
    await db.query(
      'UPDATE nft_tickets SET has_claimed_poap = TRUE, updated_at = CURRENT_TIMESTAMP WHERE token_id = $1',
      [tokenId]
    );

    // 插入 POAP 领取记录
    const existing = await db.query(
      'SELECT id FROM poap_claims WHERE token_id = $1 AND occasion_id = $2',
      [tokenId, occasionId]
    );

    if (existing.rows.length === 0) {
      await db.query(
        'INSERT INTO poap_claims(token_id, occasion_id, claimer_address, tx_hash, block_number) VALUES($1, $2, $3, $4, $5)',
        [tokenId, occasionId, lowerAddress, txHash, blockNumber]
      );
    }
    
    res.json({ message: 'POAP claim recorded successfully', tokenId });
  } catch (error) {
    console.error('Error recording POAP claim:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取单个门票详情
router.get('/:tokenId', async (req, res) => {
  const { tokenId } = req.params;
  
  if (!tokenId) {
    return res.status(400).json({ error: 'tokenId is required' });
  }

  try {
    const result = await db.query(
      `SELECT 
        token_id, 
        occasion_id, 
        seat_number, 
        owner_address, 
        tx_hash, 
        block_number,
        is_checked_in,
        has_claimed_poap,
        created_at
       FROM nft_tickets 
       WHERE token_id = $1`,
      [tokenId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ ticket: result.rows[0] });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
