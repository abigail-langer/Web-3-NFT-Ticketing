// Backend API 工具函数

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 记录购票交易
export async function recordTicketMint(data: {
  tokenId: string | number;
  occasionId: number;
  seatNumber: number;
  ownerAddress: string;
  txHash: string;
  blockNumber: number;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error recording ticket mint:', error);
    throw error;
  }
}

// 获取用户的所有门票（从数据库缓存）
export async function getUserTicketsFromCache(walletAddress: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/user/${walletAddress}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.tickets || [];
  } catch (error) {
    console.error('Error fetching user tickets from cache:', error);
    return [];
  }
}

// 记录检票
export async function recordCheckIn(data: {
  tokenId: string | number;
  occasionId: number;
  txHash: string;
  blockNumber: number;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error recording check-in:', error);
    throw error;
  }
}

// 记录 POAP 领取
export async function recordPoapClaim(data: {
  tokenId: string | number;
  occasionId: number;
  claimerAddress: string;
  txHash: string;
  blockNumber: number;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/claim-poap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error recording POAP claim:', error);
    throw error;
  }
}

// 获取单个门票详情
export async function getTicketFromCache(tokenId: string | number) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${tokenId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.ticket;
  } catch (error) {
    console.error('Error fetching ticket from cache:', error);
    return null;
  }
}
