const express = require('express');
const db = require('../db');

const router = express.Router();

// 记录用户的起始区块号（当用户第一次购票/挂单时调用）
router.post('/start-block', async (req, res) => {
  const { walletAddress, blockNumber } = req.body;
  
  if (!walletAddress || !blockNumber) {
    return res.status(400).json({ error: 'walletAddress and blockNumber are required' });
  }

  try {
    const lowerAddress = walletAddress.toLowerCase();
    
    // 检查是否已存在
    const existing = await db.query(
      'SELECT start_block FROM user_start_blocks WHERE wallet_address = $1',
      [lowerAddress]
    );

    if (existing.rows.length > 0) {
      // 如果新的区块号更早，则更新
      const currentStartBlock = BigInt(existing.rows[0].start_block);
      const newBlockNumber = BigInt(blockNumber);
      
      if (newBlockNumber < currentStartBlock) {
        await db.query(
          'UPDATE user_start_blocks SET start_block = $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_address = $2',
          [blockNumber.toString(), lowerAddress]
        );
        return res.json({ message: 'Start block updated', startBlock: blockNumber.toString() });
      }
      
      return res.json({ message: 'Start block already exists', startBlock: currentStartBlock.toString() });
    }

    // 插入新记录
    await db.query(
      'INSERT INTO user_start_blocks(wallet_address, start_block) VALUES($1, $2)',
      [lowerAddress, blockNumber.toString()]
    );
    
    res.status(201).json({ message: 'Start block recorded', startBlock: blockNumber.toString() });
  } catch (error) {
    console.error('Error recording start block:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取用户的起始区块号
router.get('/start-block/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress is required' });
  }

  try {
    const lowerAddress = walletAddress.toLowerCase();
    const result = await db.query(
      'SELECT start_block FROM user_start_blocks WHERE wallet_address = $1',
      [lowerAddress]
    );

    if (result.rows.length === 0) {
      // 如果没有记录，返回 null，前端可以从当前区块开始
      return res.json({ startBlock: null });
    }

    res.json({ startBlock: result.rows[0].start_block });
  } catch (error) {
    console.error('Error fetching start block:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 获取全局最早区块号（用于市场页面查询所有挂单）
router.get('/global-start-block', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT MIN(start_block) as min_block FROM user_start_blocks'
    );

    if (result.rows.length === 0 || result.rows[0].min_block === null) {
      // 如果没有任何记录，返回 null
      return res.json({ startBlock: null });
    }

    res.json({ startBlock: result.rows[0].min_block });
  } catch (error) {
    console.error('Error fetching global start block:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
