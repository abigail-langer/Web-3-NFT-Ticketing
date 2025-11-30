// 合约配置
export const CONTRACT_ADDRESS = '0x04f1a284B7905e879c1A22B3573BE0B66c614112' as const;
export const POAP_CONTRACT_ADDRESS = '0x2e4eb28453A763c20eBbc3AC52d310Ea917D9f63' as const;

// 合约 ABI - 只包含前端需要的函数
export const CONTRACT_ABI = [
  // 构造函数
  {
    inputs: [
      { internalType: 'string', name: '_name', type: 'string' },
      { internalType: 'string', name: '_symbol', type: 'string' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  
  // 事件
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'occasionId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: false, internalType: 'address', name: 'organizer', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'resellable', type: 'bool' }
    ],
    name: 'OccasionCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: true, internalType: 'uint256', name: 'occasionId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'seat', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'buyer', type: 'address' }
    ],
    name: 'TicketMinted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'price', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'seller', type: 'address' }
    ],
    name: 'TicketListed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'TicketDelisted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'from', type: 'address' },
      { indexed: false, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'price', type: 'uint256' }
    ],
    name: 'TicketSold',
    type: 'event'
  },
  
  // 读取函数
  {
    inputs: [],
    name: 'totalOccasions',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_id', type: 'uint256' }],
    name: 'getOccasion',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'uint256', name: 'cost', type: 'uint256' },
          { internalType: 'uint256', name: 'tickets', type: 'uint256' },
          { internalType: 'uint256', name: 'maxTickets', type: 'uint256' },
          { internalType: 'string', name: 'date', type: 'string' },
          { internalType: 'string', name: 'time', type: 'string' },
          { internalType: 'string', name: 'location', type: 'string' },
          { internalType: 'address', name: 'organizer', type: 'address' },
          { internalType: 'bool', name: 'resellable', type: 'bool' }
        ],
        internalType: 'struct TicketContract.Occasion',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_id', type: 'uint256' }],
    name: 'getSeatsTaken',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_tokenId', type: 'uint256' }],
    name: 'getListing',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'price', type: 'uint256' },
          { internalType: 'address', name: 'seller', type: 'address' },
          { internalType: 'bool', name: 'isActive', type: 'bool' }
        ],
        internalType: 'struct TicketContract.Listing',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_tokenId', type: 'uint256' }],
    name: 'getTicketInfo',
    outputs: [
      { internalType: 'uint256', name: 'occasionId', type: 'uint256' },
      { internalType: 'uint256', name: 'seat', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalOccasions',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_id', type: 'uint256' },
      { internalType: 'address', name: '_buyer', type: 'address' }
    ],
    name: 'hasBought',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_id', type: 'uint256' },
      { internalType: 'uint256', name: '_seat', type: 'uint256' }
    ],
    name: 'seatTaken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_occasionId', type: 'uint256' },
      { internalType: 'uint256', name: '_seat', type: 'uint256' }
    ],
    name: 'seatToTokenId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  
  // 写入函数
  {
    inputs: [
      { internalType: 'string', name: '_name', type: 'string' },
      { internalType: 'uint256', name: '_cost', type: 'uint256' },
      { internalType: 'uint256', name: '_maxTickets', type: 'uint256' },
      { internalType: 'string', name: '_date', type: 'string' },
      { internalType: 'string', name: '_time', type: 'string' },
      { internalType: 'string', name: '_location', type: 'string' },
      { internalType: 'bool', name: '_resellable', type: 'bool' },
      { internalType: 'uint256', name: '_eventEndTime', type: 'uint256' },
      { internalType: 'uint256', name: '_publicSaleStart', type: 'uint256' },
      { internalType: 'bool', name: '_poapEnabled', type: 'bool' }
    ],
    name: 'list',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_id', type: 'uint256' },
      { internalType: 'uint256', name: '_seat', type: 'uint256' }
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_tokenId', type: 'uint256' },
      { internalType: 'uint256', name: '_price', type: 'uint256' }
    ],
    name: 'listTicket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_tokenId', type: 'uint256' }],
    name: 'delistTicket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_tokenId', type: 'uint256' }],
    name: 'buyTicket',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  // POAP 相关函数
  {
    inputs: [{ internalType: 'uint256', name: '_occasionId', type: 'uint256' }],
    name: 'claimPOAP',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'getUserPOAPBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_occasionId', type: 'uint256' },
      { internalType: 'uint256', name: '_seat', type: 'uint256' }
    ],
    name: 'isPrioritySeat',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_occasionId', type: 'uint256' }],
    name: 'getPrioritySeats',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  // 检票相关函数
  {
    inputs: [{ internalType: 'uint256', name: '_tokenId', type: 'uint256' }],
    name: 'checkIn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_tokenId', type: 'uint256' }],
    name: 'isCheckedIn',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_occasionId', type: 'uint256' },
      { internalType: 'address', name: '_user', type: 'address' }
    ],
    name: 'getUserTicketsCheckInStatus',
    outputs: [
      { internalType: 'uint256[]', name: 'tokenIds', type: 'uint256[]' },
      { internalType: 'bool[]', name: 'checkedIn', type: 'bool[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// POAP Token ABI
export const POAP_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint256', name: 'index', type: 'uint256' }
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;
