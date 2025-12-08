# NFT Ticketing System - Technical Presentation
## Early Bird Sale & Login System Implementation

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Feature 1: Login System](#feature-1-login-system)
3. [Feature 2: Early Bird Sale System](#feature-2-early-bird-sale-system)
4. [Implementation Details](#implementation-details)
5. [Modified Files Summary](#modified-files-summary)
6. [Testing Guide](#testing-guide)

---

## 🎯 Project Overview

**Project**: Web3 NFT Ticketing Platform
**Network**: Base Sepolia Testnet (Chain ID: 84532)
**Tech Stack**:
- **Frontend**: Next.js 15.5.6, React, TypeScript, Tailwind CSS
- **Web3**: Wagmi v2, RainbowKit, Viem, Ethers.js
- **Smart Contracts**: Solidity 0.8.24, Hardhat, OpenZeppelin
- **Blockchain**: Ethereum-compatible (Base Sepolia)

**Deployed Contracts**:
- TicketContract: `0xfA5b73Df970393bc5952FC4e14b7D04384D0a22f`
- POAPToken: `0xeD954C4bC309f41C838E875FAc10bd567F01e3b9`

---

## 🔐 Feature 1: Login System

### 1.1 Business Requirements

- Users must login before accessing the main application
- Simple session-based authentication (for demonstration purposes)
- No complex backend authentication system required
- Session persists within browser tab (sessionStorage)

### 1.2 Technical Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─── Login Page (/login)
       │    └─── Simple form validation
       │         └─── Store session: sessionStorage
       │
       └─── Main Page (/)
            └─── Check session on mount
                 ├─── If logged in: Show content
                 └─── If not logged in: Redirect to /login
```

### 1.3 Implementation Details

#### Frontend Components Created/Modified:

**1. Login Page** (`frontend/app/login/page.tsx`)
```typescript
// Key features:
- Username and password input fields
- Session storage on successful login
- Automatic redirection to main page
- Beautiful gradient UI matching main theme

// Core logic:
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();

  if (username.trim() && password.trim()) {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', username);
    router.push('/');
  }
}
```

**2. Main Page Protection** (`frontend/app/page.tsx`)
```typescript
// Session check on component mount:
useEffect(() => {
  const loggedIn = sessionStorage.getItem('isLoggedIn');
  const storedUsername = sessionStorage.getItem('username');

  if (loggedIn === 'true' && storedUsername) {
    setIsLoggedIn(true);
    setUsername(storedUsername);
  } else {
    router.push('/login'); // Redirect to login
  }
}, [router]);

// Logout functionality:
const handleLogout = () => {
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('username');
  router.push('/login');
};
```

**3. UI Enhancements**
- Welcome message: "Welcome back, {username}!"
- Logout button in header
- Loading state during redirect

### 1.4 Files Modified

| File | Type | Changes |
|------|------|---------|
| `frontend/app/login/page.tsx` | **Created** | Complete login page component |
| `frontend/app/page.tsx` | Modified | Added auth check, logout button, welcome message |

### 1.5 User Flow

```
User visits http://localhost:3000
    ↓
Not logged in → Redirect to /login
    ↓
Enter any username/password
    ↓
Click "Login" button
    ↓
Session stored in sessionStorage
    ↓
Redirect to main page (/)
    ↓
See events and connect wallet
    ↓
Click "Logout" → Clear session → Back to /login
```

---

## 🐦 Feature 2: Early Bird Sale System

### 2.1 Business Requirements

**Requirement**:
1. Organizers can set **two release dates** for each ticket:
   - **Early Bird Sale Date** (optional)
   - **Public Sale Date** (required)

2. Purchase rules:
   - **Early Bird Period** (`earlySaleStart` ~ `publicSaleStart`):
     - Only users with **5+ POAP badges** can purchase
   - **Public Period** (`publicSaleStart` onwards):
     - All users can purchase

### 2.2 Technical Architecture

```
Smart Contract Layer (Solidity)
    ↓
├─── Occasion Struct
│    ├─── earlySaleStart: uint256 (timestamp)
│    ├─── publicSaleStart: uint256 (timestamp)
│    └─── eventEndTime: uint256 (timestamp)
│
├─── Access Control Logic
│    └─── _checkSalePermission(occasionId, buyer)
│         ├─── If in early bird period
│         │    └─── Require 5+ POAPs
│         ├─── If before any sale
│         │    └─── Revert
│         └─── If in public period
│              └─── Allow all
│
└─── Frontend Layer (React/TypeScript)
     └─── Create Event Form
          ├─── Early Bird Sale Date/Time inputs
          ├─── Public Sale Date/Time inputs
          └─── Convert to Unix timestamps for contract
```

### 2.3 Backend Implementation (Smart Contract)

#### 2.3.1 Contract Structure Modification

**File**: `contracts/TicketContract.sol`

**Original Struct**:
```solidity
struct Occasion {
    uint256 id;
    string name;
    uint256 cost;
    // ... other fields
    uint256 publicSaleStart; // Only one sale time
    bool poapEnabled;
}
```

**Updated Struct**:
```solidity
struct Occasion {
    uint256 id;
    string name;
    uint256 cost;
    // ... other fields
    uint256 earlySaleStart;   // NEW: Early bird sale time
    uint256 publicSaleStart;  // Public sale time
    bool poapEnabled;
}
```

#### 2.3.2 Function: Create Event

**Modified Function**: `list()`

```solidity
function list(
    string memory _name,
    uint256 _cost,
    uint256 _maxTickets,
    string memory _date,
    string memory _time,
    string memory _location,
    bool _resellable,
    uint256 _eventEndTime,
    uint256 _earlySaleStart,    // NEW PARAMETER
    uint256 _publicSaleStart,   // EXISTING
    bool _poapEnabled
) public {
    require(_eventEndTime > block.timestamp, "Event end time must be in future");
    require(_publicSaleStart <= _eventEndTime, "Public sale must start before event ends");

    // NEW: Validate early sale time
    if (_earlySaleStart > 0) {
        require(_earlySaleStart <= _publicSaleStart,
                "Early sale must start before or equal to public sale");
    }

    totalOccasions++;
    occasions[totalOccasions] = Occasion(
        totalOccasions,
        _name,
        _cost,
        _maxTickets,
        _maxTickets,
        _date,
        _time,
        _location,
        msg.sender,
        _resellable,
        _eventEndTime,
        _earlySaleStart,      // NEW
        _publicSaleStart,
        _poapEnabled
    );

    emit OccasionCreated(totalOccasions, _name, msg.sender, _resellable, _poapEnabled);
}
```

#### 2.3.3 Function: Access Control

**New Internal Function**: `_checkSalePermission()`

```solidity
/**
 * @dev Check if user has permission to purchase tickets
 * @param _occasionId The event ID
 * @param _buyer The buyer's address
 */
function _checkSalePermission(uint256 _occasionId, address _buyer) internal view {
    Occasion storage occasion = occasions[_occasionId];
    uint256 userPOAPBalance = getUserPOAPBalance(_buyer);

    // If early bird sale is enabled and we're in early bird period
    if (occasion.earlySaleStart > 0 &&
        block.timestamp >= occasion.earlySaleStart &&
        block.timestamp < occasion.publicSaleStart) {

        // Early bird period: Require 5+ badges
        require(userPOAPBalance >= 5, "Need 5+ badges for early bird sale");

    } else if (block.timestamp < occasion.publicSaleStart) {
        // Before any sale period
        revert("Sale has not started yet");
    }
    // If we reach here, it's public sale period - all users allowed
}
```

**Why this design?**
- ✅ Separated logic from `mint()` function to avoid "Stack too deep" error
- ✅ Reusable for other purchase functions if needed
- ✅ Clear and readable access control logic

#### 2.3.4 Function: Purchase Tickets

**Modified Function**: `mint()`

```solidity
function mint(uint256 _id, uint256 _seat) public payable nonReentrant {
    require(_id != 0 && _id <= totalOccasions, "Invalid occasion ID");
    Occasion storage occasion = occasions[_id];

    // NEW: Check purchase permission
    _checkSalePermission(_id, msg.sender);

    require(msg.value >= occasion.cost, "Insufficient payment");
    require(seatTaken[_id][_seat] == address(0), "Seat already taken");
    require(_seat > 0 && _seat <= occasion.maxTickets, "Invalid seat number");

    // Check priority seat access
    if (isPrioritySeat(_id, _seat)) {
        require(getUserPOAPBalance(msg.sender) > 0,
                "Priority seat reserved for POAP holders");
    }

    // ... rest of minting logic
}
```

#### 2.3.5 Compilation Fix: Stack Too Deep

**Issue**: Solidity has a limit of 16 local variables per function. Adding more fields caused compilation error.

**Solution**: Enable IR-based compiler in `hardhat.config.js`

```javascript
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true  // NEW: Enable IR-based compilation
    }
  },
  // ... rest of config
}
```

**What is viaIR?**
- IR = Intermediate Representation
- Compiles Solidity → Yul (IR) → Bytecode
- Better optimization, avoids "Stack too deep" errors
- Slightly longer compilation time but more efficient bytecode

### 2.4 Frontend Implementation

#### 2.4.1 Form State Management

**File**: `frontend/app/create-event/page.tsx`

**State Definition**:
```typescript
const [formData, setFormData] = useState({
  name: '',
  cost: '0',
  maxTickets: '',
  date: '',
  time: '',
  location: '',
  resellable: true,

  // NEW: Early bird sale fields
  earlySaleDate: '',
  earlySaleTime: '',
  enableEarlySale: false,

  // NEW: Public sale fields
  publicSaleDate: '',
  publicSaleTime: '',

  // NEW: Event end fields
  eventEndDate: '',
  eventEndTime: '',

  enablePOAP: false,
});
```

#### 2.4.2 Form UI Components

**Early Bird Sale Section**:
```typescript
{/* Enable Early Bird Sale Checkbox */}
<input
  type="checkbox"
  id="enableEarlySale"
  checked={formData.enableEarlySale}
  onChange={(e) => setFormData({ ...formData, enableEarlySale: e.target.checked })}
/>
<label htmlFor="enableEarlySale">
  🐦 Enable Early Bird Sale (Requires 5+ Badges)
</label>

{/* Conditional rendering: Show only when enabled */}
{formData.enableEarlySale && (
  <div className="grid md:grid-cols-2 gap-4">
    <input
      type="date"
      value={formData.earlySaleDate}
      onChange={(e) => setFormData({ ...formData, earlySaleDate: e.target.value })}
    />
    <input
      type="time"
      value={formData.earlySaleTime}
      onChange={(e) => setFormData({ ...formData, earlySaleTime: e.target.value })}
    />
  </div>
)}
```

**Public Sale & Event End Sections**:
```typescript
{/* Public Sale Date/Time - Always Required */}
<div className="grid md:grid-cols-2 gap-4">
  <div>
    <label>Public Sale Date (Year-Month-Day) *</label>
    <input type="date" value={formData.publicSaleDate} required />
  </div>
  <div>
    <label>Public Sale Time *</label>
    <input type="time" value={formData.publicSaleTime} required />
  </div>
</div>

{/* Event End Date/Time - Always Required */}
<div className="grid md:grid-cols-2 gap-4">
  <div>
    <label>Event End Date (Year-Month-Day) *</label>
    <input type="date" value={formData.eventEndDate} required />
  </div>
  <div>
    <label>Event End Time *</label>
    <input type="time" value={formData.eventEndTime} required />
  </div>
</div>
```

#### 2.4.3 Form Submission Logic

**Date/Time Conversion**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!formData.publicSaleDate || !formData.publicSaleTime) {
    alert('Please set the public sale date and time');
    return;
  }

  if (!formData.eventEndDate || !formData.eventEndTime) {
    alert('Please set the event end date and time');
    return;
  }

  try {
    const costInWei = parseEther(formData.cost);

    // Convert dates to Unix timestamps
    const publicSaleTimestamp = Math.floor(
      new Date(`${formData.publicSaleDate}T${formData.publicSaleTime}`).getTime() / 1000
    );

    const eventEndTimestamp = Math.floor(
      new Date(`${formData.eventEndDate}T${formData.eventEndTime}`).getTime() / 1000
    );

    // Early sale: 0 if disabled, timestamp if enabled
    let earlySaleTimestamp = 0;
    if (formData.enableEarlySale && formData.earlySaleDate && formData.earlySaleTime) {
      earlySaleTimestamp = Math.floor(
        new Date(`${formData.earlySaleDate}T${formData.earlySaleTime}`).getTime() / 1000
      );
    }

    // Call smart contract
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'list',
      args: [
        formData.name,
        costInWei,
        BigInt(formData.maxTickets),
        formData.date,
        formData.time,
        formData.location,
        formData.resellable,
        BigInt(eventEndTimestamp),        // Event end time
        BigInt(earlySaleTimestamp),       // Early bird (0 or timestamp)
        BigInt(publicSaleTimestamp),      // Public sale
        formData.enablePOAP,              // POAP enabled
      ],
    });
  } catch (error) {
    console.error('Failed to create event:', error);
  }
};
```

**Why this approach?**
- ✅ User-friendly date/time pickers (browser native)
- ✅ Automatic timezone handling
- ✅ Converts to Unix timestamp (required by smart contract)
- ✅ Validates before submission
- ✅ Sets `earlySaleStart = 0` if early bird is disabled

#### 2.4.4 Contract Configuration Update

**File**: `frontend/config/contract.ts`

```typescript
// Update contract addresses after deployment
export const CONTRACT_ADDRESS = '0xfA5b73Df970393bc5952FC4e14b7D04384D0a22f' as const;
export const POAP_CONTRACT_ADDRESS = '0xeD954C4bC309f41C838E875FAc10bd567F01e3b9' as const;

// Contract ABI already includes the new function signature
```

**File**: `frontend/.env.local`

```bash
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CONTRACT_ADDRESS=0xfA5b73Df970393bc5952FC4e14b7D04384D0a22f
```

### 2.5 Deployment Process

**File**: `scripts/deploy-with-poap.js`

**Updated Deployment Script**:
```javascript
const now = Math.floor(Date.now() / 1000);
const earlySaleStart = now + 1800;  // 30 minutes from now
const publicSaleStart = now + 3600; // 1 hour from now
const eventEndTime = now + 86400 * 7; // 7 days from now

const tx3 = await ticketContract.list(
  "Web3 Conference 2025",
  hre.ethers.parseEther("0.01"),
  100,
  "2025-12-01",
  "14:00",
  "Shanghai, China",
  true,
  eventEndTime,        // Event end time
  earlySaleStart,      // NEW: Early bird time
  publicSaleStart,     // Public sale time
  true                 // POAP enabled
);

console.log("早鸟票开售时间:", new Date(earlySaleStart * 1000).toLocaleString(), "(需5+徽章)");
console.log("普通票开售时间:", new Date(publicSaleStart * 1000).toLocaleString());
```

**Deployment Info** (`deployment-info-with-poap.json`):
```json
{
  "network": "baseSepolia",
  "contracts": {
    "TicketContract": {
      "address": "0xfA5b73Df970393bc5952FC4e14b7D04384D0a22f"
    },
    "POAPToken": {
      "address": "0xeD954C4bC309f41C838E875FAc10bd567F01e3b9"
    }
  },
  "testEvent": {
    "id": 1,
    "name": "Web3 Conference 2025",
    "cost": "0.01",
    "maxTickets": 100,
    "earlySaleStart": 1764793475,
    "publicSaleStart": 1764795275,
    "eventEndTime": 1765396475
  }
}
```

---

## 📂 Modified Files Summary

### Feature 1: Login System

| File Path | Action | Purpose |
|-----------|--------|---------|
| `frontend/app/login/page.tsx` | **Created** | Login page component with form validation |
| `frontend/app/page.tsx` | Modified | Added session check, logout button, welcome message |

**Total Files**: 2 (1 created, 1 modified)

### Feature 2: Early Bird Sale System

#### Smart Contract Layer

| File Path | Action | Changes |
|-----------|--------|---------|
| `contracts/TicketContract.sol` | Modified | - Added `earlySaleStart` to Occasion struct<br>- Modified `list()` function signature<br>- Added `_checkSalePermission()` internal function<br>- Updated `mint()` function logic |
| `hardhat.config.js` | Modified | - Enabled `viaIR: true` compiler option |

#### Deployment Scripts

| File Path | Action | Changes |
|-----------|--------|---------|
| `scripts/deploy-with-poap.js` | Modified | - Updated `list()` call with `earlySaleStart` parameter<br>- Added logging for early bird time<br>- Updated deployment info structure |

#### Frontend Layer

| File Path | Action | Changes |
|-----------|--------|---------|
| `frontend/app/create-event/page.tsx` | Modified | - Added 7 new form state fields<br>- Added early bird, public sale, event end date/time inputs<br>- Implemented date-to-timestamp conversion<br>- Updated contract call with new parameters |
| `frontend/config/contract.ts` | Modified | - Updated `CONTRACT_ADDRESS`<br>- Updated `POAP_CONTRACT_ADDRESS` |
| `frontend/.env.local` | Modified | - Updated `NEXT_PUBLIC_CONTRACT_ADDRESS` |

#### Configuration Files

| File Path | Action | Changes |
|-----------|--------|---------|
| `deployment-info-with-poap.json` | Auto-updated | - New contract addresses<br>- Added `earlySaleStart` field |

**Total Files**: 8 files modified

---

## 🔧 Implementation Details

### Key Functions Introduced

#### 1. Smart Contract Functions

| Function Name | Type | Purpose | Parameters |
|---------------|------|---------|------------|
| `_checkSalePermission` | Internal | Validate purchase timing and POAP requirements | `_occasionId`, `_buyer` |
| `getUserPOAPBalance` | Public View | Get user's POAP badge count | `_user` |
| `list` | Public | Create event (modified signature) | Added `_earlySaleStart` parameter |

#### 2. Frontend Functions

| Function Name | Component | Purpose |
|---------------|-----------|---------|
| `handleLogin` | LoginPage | Process login and store session |
| `handleLogout` | HomePage | Clear session and redirect |
| `handleSubmit` | CreateEventPage | Convert dates and submit to contract |

### Technical Decisions & Rationale

#### 1. Why sessionStorage instead of localStorage?

**Decision**: Use `sessionStorage` for login state

**Rationale**:
- ✅ Session expires when tab closes (better security)
- ✅ Prevents persistent login across browser restarts
- ✅ Suitable for demo/prototype purposes
- ❌ Would use JWT tokens + backend auth in production

#### 2. Why separate `_checkSalePermission()` function?

**Decision**: Extract permission logic to internal function

**Rationale**:
- ✅ Avoids "Stack too deep" compiler error
- ✅ Improves code readability and maintainability
- ✅ Reusable for future purchase functions
- ✅ Easier to test and audit

#### 3. Why `earlySaleStart = 0` for disabled early bird?

**Decision**: Use `0` as sentinel value instead of boolean flag

**Rationale**:
- ✅ Saves gas (one less boolean field in struct)
- ✅ Timestamp can't be `0` in practice (year 1970)
- ✅ Simplifies contract logic with single check: `if (earlySaleStart > 0)`
- ✅ Backward compatible (can always add early bird later)

#### 4. Why enable `viaIR` compilation?

**Decision**: Use IR-based compiler

**Rationale**:
- ✅ Required to fix "Stack too deep" error
- ✅ Better code optimization
- ✅ Handles complex function logic better
- ❌ Slightly slower compilation (acceptable tradeoff)

#### 5. Why conditional rendering for early bird inputs?

**Decision**: Show early bird fields only when checkbox is enabled

**Rationale**:
- ✅ Cleaner UI, less overwhelming for users
- ✅ Clear indication that early bird is optional
- ✅ Prevents confusion about required vs optional fields
- ✅ Better mobile experience (less scrolling)

---

## 🧪 Testing Guide

### Feature 1: Login System

**Test Case 1: Login Flow**
```
1. Visit http://localhost:3000
2. Should auto-redirect to /login
3. Enter username: "testuser"
4. Enter password: "password123"
5. Click "Login"
6. Should redirect to main page
7. Should see "Welcome back, testuser!" message
8. Should see "Logout" button in header
```

**Test Case 2: Logout Flow**
```
1. From main page (while logged in)
2. Click "Logout" button
3. Should clear session
4. Should redirect to /login
5. Refresh page - should stay on /login
```

**Test Case 3: Session Persistence**
```
1. Login successfully
2. Navigate to different pages (My Events, etc.)
3. Should remain logged in
4. Close browser tab
5. Open new tab to http://localhost:3000
6. Should redirect to /login (session expired)
```

### Feature 2: Early Bird Sale System

#### Backend Testing (Smart Contract)

**Test Case 1: Create Event with Early Bird**
```javascript
// Deploy and create event
const earlySale = Math.floor(Date.now() / 1000) + 3600;  // 1 hour
const publicSale = Math.floor(Date.now() / 1000) + 7200; // 2 hours
const eventEnd = Math.floor(Date.now() / 1000) + 86400;  // 1 day

await ticketContract.list(
  "Test Event",
  ethers.parseEther("0.01"),
  100,
  "2025-12-25",
  "18:00",
  "Test Venue",
  true,
  eventEnd,
  earlySale,
  publicSale,
  true
);

// Verify struct values
const occasion = await ticketContract.occasions(1);
assert(occasion.earlySaleStart == earlySale);
assert(occasion.publicSaleStart == publicSale);
```

**Test Case 2: Early Bird Access Control**
```javascript
// User with 0 POAPs tries to buy during early bird period
await expect(
  ticketContract.connect(userWithoutPOAP).mint(1, 1, { value: ethers.parseEther("0.01") })
).to.be.revertedWith("Need 5+ badges for early bird sale");

// User with 5+ POAPs can buy
await expect(
  ticketContract.connect(userWith5POAPs).mint(1, 1, { value: ethers.parseEther("0.01") })
).to.not.be.reverted;
```

**Test Case 3: Public Sale Access**
```javascript
// Fast forward to public sale time
await ethers.provider.send("evm_increaseTime", [7200]);
await ethers.provider.send("evm_mine");

// Any user can buy now
await expect(
  ticketContract.connect(userWithoutPOAP).mint(1, 2, { value: ethers.parseEther("0.01") })
).to.not.be.reverted;
```

#### Frontend Testing

**Test Case 1: Create Event Form - Early Bird Enabled**
```
1. Navigate to /create-event
2. Fill in basic event info
3. Check "Enable Early Bird Sale" checkbox
4. Early bird date/time fields should appear (blue background)
5. Set Early Bird: 2025-12-10 10:00
6. Set Public Sale: 2025-12-10 14:00
7. Set Event End: 2025-12-15 18:00
8. Submit form
9. Verify transaction on BaseScan
10. Check deployment-info-with-poap.json for timestamps
```

**Test Case 2: Create Event Form - Early Bird Disabled**
```
1. Navigate to /create-event
2. Fill in basic event info
3. Keep "Enable Early Bird Sale" unchecked
4. Early bird fields should be hidden
5. Set Public Sale: 2025-12-10 14:00
6. Set Event End: 2025-12-15 18:00
7. Submit form
8. Contract call should have earlySaleStart = 0
```

**Test Case 3: Form Validation**
```
1. Try to submit without Public Sale Date
   → Should show error: "Please set the public sale date and time"
2. Try to submit without Event End Date
   → Should show error: "Please set the event end date and time"
3. Enable early bird but don't fill dates
   → Should succeed with earlySaleStart = 0
```

#### Integration Testing

**End-to-End Test Scenario**:
```
1. Login to application
2. Connect wallet (Base Sepolia)
3. Create event with early bird enabled:
   - Early Bird: Now + 5 minutes
   - Public Sale: Now + 10 minutes
4. Wait 5 minutes (or modify timestamps in contract)
5. User A (0 POAPs) tries to buy → Should fail
6. User B (5 POAPs) tries to buy → Should succeed
7. Wait until public sale
8. User A tries again → Should succeed
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │ Login Page   │────>│  Main Page   │<────│ Create Event│ │
│  │ /login       │     │  /           │     │ /create-     │ │
│  │              │     │              │     │  event       │ │
│  │ - Username   │     │ - Auth Check │     │ - Early Bird │ │
│  │ - Password   │     │ - Logout Btn │     │ - Public Sale│ │
│  │ - Session    │     │ - Welcome    │     │ - Event End  │ │
│  └──────────────┘     └──────┬───────┘     └──────┬────────┘ │
│                               │                    │          │
│                               │ Wagmi/Viem         │          │
│                               ▼                    ▼          │
└───────────────────────────────┼────────────────────┼──────────┘
                                │                    │
                                │   Web3 Connection  │
                                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  Base Sepolia Network (RPC)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Smart Contracts (Solidity)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TicketContract (0xfA5b...a22f)                         │ │
│  │  ├─ Occasion Struct                                     │ │
│  │  │  ├─ earlySaleStart: uint256                          │ │
│  │  │  ├─ publicSaleStart: uint256                         │ │
│  │  │  └─ eventEndTime: uint256                            │ │
│  │  │                                                       │ │
│  │  ├─ list() - Create Event                               │ │
│  │  │  └─ Validates: early <= public <= end                │ │
│  │  │                                                       │ │
│  │  ├─ _checkSalePermission() - Access Control             │ │
│  │  │  ├─ If early bird period → Require 5+ POAPs          │ │
│  │  │  ├─ If before sale → Revert                          │ │
│  │  │  └─ If public period → Allow all                     │ │
│  │  │                                                       │ │
│  │  └─ mint() - Purchase Ticket                            │ │
│  │     └─ Calls _checkSalePermission()                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  POAPToken (0xeD95...e3b9)                              │ │
│  │  ├─ balanceOf() - Get badge count                       │ │
│  │  └─ mintPOAP() - Reward attendees                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎓 Key Takeaways

### Technical Achievements

1. **Login System**
   - ✅ Simple session-based authentication
   - ✅ Clean UI/UX with automatic redirects
   - ✅ Minimal code, maximum effect

2. **Early Bird Sale System**
   - ✅ Flexible time-based access control
   - ✅ POAP-gated early access (5+ badges requirement)
   - ✅ Optional feature (can disable per event)
   - ✅ Gas-efficient implementation

3. **Code Quality**
   - ✅ Modular function design
   - ✅ Clear separation of concerns
   - ✅ Comprehensive validation
   - ✅ Type-safe TypeScript

4. **Deployment**
   - ✅ Successfully deployed to Base Sepolia
   - ✅ Verified contract addresses
   - ✅ Test event created with early bird enabled

### Challenges Overcome

| Challenge | Solution |
|-----------|----------|
| Stack too deep compiler error | Enabled viaIR compilation mode |
| Complex access control logic | Extracted to separate internal function |
| Date/time user input | Used HTML5 date/time inputs + conversion |
| Optional early bird feature | Used `0` as sentinel value |
| Session management | Used sessionStorage for simplicity |

### Production Considerations

For a production deployment, consider:

1. **Login System**
   - Implement proper backend authentication (JWT, OAuth)
   - Add password hashing (bcrypt)
   - Implement rate limiting
   - Add 2FA support

2. **Smart Contract**
   - Conduct professional security audit
   - Add emergency pause functionality
   - Implement upgradeability (proxy pattern)
   - Add more comprehensive events for monitoring

3. **Frontend**
   - Add loading states and error handling
   - Implement retry logic for failed transactions
   - Add transaction history tracking
   - Improve mobile responsiveness

---

## 📞 Contact & Resources

**Project Repository**: https://github.com/abigail-langer/Web-3-NFT-Ticketing
**Branch**: master-v2

**Deployed Contracts** (Base Sepolia):
- TicketContract: [`0xfA5b73Df970393bc5952FC4e14b7D04384D0a22f`](https://sepolia.basescan.org/address/0xfA5b73Df970393bc5952FC4e14b7D04384D0a22f)
- POAPToken: [`0xeD954C4bC309f41C838E875FAc10bd567F01e3b9`](https://sepolia.basescan.org/address/0xeD954C4bC309f41C838E875FAc10bd567F01e3b9)

**Frontend URL**: http://localhost:3000 (Development)

---

## 🙏 Thank You!

Questions?

---

**Document Version**: 1.0
**Last Updated**: December 3, 2025
**Author**: Technical Team
