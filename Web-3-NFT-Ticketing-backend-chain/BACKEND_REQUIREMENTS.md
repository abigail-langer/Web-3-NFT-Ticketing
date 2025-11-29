# Backend Development Requirements

## Project Overview

NFT Ticket System - A decentralized event ticketing system on Base Sepolia testnet.

The frontend development is complete. The backend team needs to provide smart contract deployment and related API support.

---

## Critical Requirements

### 1. Smart Contract Deployment

**Must Provide**:
- Contract deployed to **Base Sepolia Testnet**
- Contract address (0x...)
- Complete contract ABI (JSON format)

**Chain Information**:
- Network: Base Sepolia
- Chain ID: 84532
- RPC URL: https://sepolia.base.org
- Block Explorer: https://sepolia.basescan.org

---

## Smart Contract Function Requirements

### Required Contract Functions

#### 1. Purchase Ticket (Write Function)
```solidity
function purchaseTicket(uint256 eventId, uint256 quantity) external payable;
```

**Parameters**:
- `eventId`: Event ID
- `quantity`: Purchase quantity

**Requirements**:
- Must accept ETH payment (payable)
- Should emit events for frontend monitoring
- Return purchased NFT Token IDs

---

#### 2. Get Event Information (Read Function)
```solidity
function getEventInfo(uint256 eventId) external view returns (
    string memory name,
    uint256 price,
    uint256 totalSupply,
    uint256 remaining
);
```

**Return Values**:
- `name`: Event name
- `price`: Ticket price (wei)
- `totalSupply`: Total supply
- `remaining`: Remaining tickets

---

#### 3. Get Owned Tickets (Read Function)
```solidity
function getOwnedTickets(address owner) external view returns (uint256[] memory);
```

**Return Values**:
- Array of all Token IDs owned by the user

---

### Recommended Additional Functions

#### 4. Ticket Transfer
```solidity
function transferTicket(address to, uint256 tokenId) external;
```

#### 5. Verify Ticket
```solidity
function verifyTicket(uint256 tokenId) external view returns (bool valid, uint256 eventId);
```

#### 6. Use Ticket (Check-in)
```solidity
function useTicket(uint256 tokenId) external;
```

#### 7. Refund Function (Optional)
```solidity
function refundTicket(uint256 tokenId) external;
```

---

## NFT Standard Requirements

### ERC-721 Compatibility
The contract should implement the ERC-721 standard, including:
- `balanceOf(address owner)`
- `ownerOf(uint256 tokenId)`
- `transferFrom(address from, address to, uint256 tokenId)`
- `approve(address to, uint256 tokenId)`
- `getApproved(uint256 tokenId)`
- `setApprovalForAll(address operator, bool approved)`
- `isApprovedForAll(address owner, address operator)`

### Token Metadata (Important)

Each NFT should have metadata following the standard format:

```solidity
function tokenURI(uint256 tokenId) external view returns (string memory);
```

**Metadata JSON Format**:
```json
{
  "name": "Event Ticket #123",
  "description": "NFT ticket for [Event Name]",
  "image": "ipfs://...",
  "attributes": [
    {
      "trait_type": "Event Name",
      "value": "Concert 2024"
    },
    {
      "trait_type": "Event Date",
      "value": "2024-12-31"
    },
    {
      "trait_type": "Seat Number",
      "value": "A-123"
    },
    {
      "trait_type": "Price",
      "value": "0.01 ETH"
    },
    {
      "trait_type": "Status",
      "value": "Valid"
    }
  ]
}
```

---

## Contract Events

Frontend needs to monitor the following events:

```solidity
event TicketPurchased(
    address indexed buyer,
    uint256 indexed eventId,
    uint256 indexed tokenId,
    uint256 quantity,
    uint256 totalPrice
);

event TicketUsed(
    uint256 indexed tokenId,
    address indexed owner,
    uint256 timestamp
);

event TicketTransferred(
    address indexed from,
    address indexed to,
    uint256 indexed tokenId
);
```

---

## Backend API Requirements (Optional but Recommended)

### 1. Get Ticket Details
```
GET /api/tickets/:tokenId
```

**Response**:
```json
{
  "tokenId": "123",
  "eventName": "Concert 2024",
  "eventDate": "2024-12-31T20:00:00Z",
  "location": "Stadium A",
  "seatNumber": "A-123",
  "price": "0.01",
  "status": "valid",
  "qrCode": "base64_encoded_qr_code",
  "owner": "0x..."
}
```

---

### 2. Generate QR Code
```
GET /api/tickets/:tokenId/qrcode
```

**Response**: QR Code image (PNG/SVG) or Base64 encoded

**QR Code should contain**:
- Token ID
- Event ID
- Owner Address
- Signature (anti-counterfeit)

---

### 3. Verify QR Code
```
POST /api/tickets/verify
```

**Request Body**:
```json
{
  "qrData": "encrypted_qr_string",
  "signature": "0x..."
}
```

**Response**:
```json
{
  "valid": true,
  "tokenId": "123",
  "eventName": "Concert 2024",
  "owner": "0x...",
  "used": false
}
```

---

### 4. Get Event List
```
GET /api/events
```

**Response**:
```json
{
  "events": [
    {
      "eventId": 1,
      "name": "Concert 2024",
      "date": "2024-12-31T20:00:00Z",
      "location": "Stadium A",
      "price": "0.01",
      "totalSupply": 1000,
      "remaining": 850,
      "image": "ipfs://..."
    }
  ]
}
```

---

### 5. Create Event (Admin)
```
POST /api/events
```

**Request Body**:
```json
{
  "name": "Concert 2024",
  "date": "2024-12-31T20:00:00Z",
  "location": "Stadium A",
  "price": "0.01",
  "totalSupply": 1000,
  "image": "ipfs://...",
  "description": "Amazing concert event"
}
```

---

## Data Storage Recommendations

### On-Chain (Blockchain)
- NFT ownership
- Event basic information (ID, price, supply)
- Ticket usage status

### Off-Chain (Database/IPFS)
- Event detailed information (description, images, location)
- NFT metadata
- QR Code data
- Transaction history (optional, for faster queries)

---

## Test Data Requirements

Please provide at least 2-3 test events including:
1. Low-price event (0.001 ETH)
2. Medium-price event (0.01 ETH)
3. Nearly sold-out event (remaining tickets < 10)

---

## Delivery Checklist

Please provide the following files and information:

- [ ] Contract address (Base Sepolia)
- [ ] Complete contract ABI (JSON file)
- [ ] Contract source code (Solidity)
- [ ] Verified contract (on Basescan)
- [ ] Deployment scripts and instructions
- [ ] Test cases
- [ ] API documentation (if providing backend API)
- [ ] Contract function call examples
- [ ] Test accounts and test ETH (if needed)

---

## Integration Process

1. **Backend deploys contract** - Provide contract address and ABI
2. **Frontend updates configuration** - Update `CONTRACT_ADDRESS` and `TICKET_CONTRACT_ABI`
3. **Integration testing** - Test purchase, query, transfer functions
4. **Optimization and fixes** - Adjust based on test results
5. **Deployment** - Sync frontend and backend deployment

---

## Contact Information

For questions, contact the frontend development team:

- GitHub Issues: [Repository Link]
- Email: [Your Email]
- Discord/Telegram: [If Available]

---

## Reference Resources

- [Base Sepolia Documentation](https://docs.base.org/)
- [OpenZeppelin ERC-721](https://docs.openzeppelin.com/contracts/4.x/erc721)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [Base Sepolia Block Explorer](https://sepolia.basescan.org/)

---

**Last Updated**: 2024-10-10
**Frontend Version**: v0.1.0
**Document Version**: v1.0
