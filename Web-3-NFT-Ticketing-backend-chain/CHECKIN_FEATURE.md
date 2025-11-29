# 🎫 检票功能说明文档

## 📋 功能概述

新增的检票功能允许活动组织者在活动现场扫描门票二维码进行检票，用户只有在检票后才能领取 POAP 奖励。

---

## 🔧 合约修改内容

### 1. 新增状态变量
```solidity
// 门票是否已检票
mapping(uint256 => bool) public hasCheckedIn; // tokenId => 是否已检票
```

### 2. 新增事件
```solidity
event TicketCheckedIn(uint256 indexed tokenId, uint256 indexed occasionId, address indexed holder, uint256 checkInTime);
```

### 3. 新增函数

#### `checkIn(uint256 _tokenId)`
- **功能**: 检票（仅活动组织者可调用）
- **权限**: 只有活动组织者可以调用
- **参数**: `_tokenId` - 门票的 Token ID
- **限制**: 
  - Token 必须存在
  - 只能由活动组织者检票
  - 每张票只能检票一次

#### `isCheckedIn(uint256 _tokenId)`
- **功能**: 查询门票是否已检票
- **返回**: `bool` - 是否已检票

#### `getUserTicketsCheckInStatus(uint256 _occasionId, address _user)`
- **功能**: 获取用户在某活动的所有门票及检票状态
- **返回**: 
  - `tokenIds[]` - 用户持有的门票 Token ID 列表
  - `checkedIn[]` - 对应的检票状态列表

### 4. 修改的函数

#### `claimPOAP(uint256 _occasionId)`
- **修改前**: 活动结束后可领取 POAP
- **修改后**: 检票后可领取 POAP
- **新增检查**: 
  ```solidity
  // 检查用户是否持有该活动的票，并且已检票
  bool hasValidCheckedInTicket = false;
  for (uint256 i = 1; i <= totalSupply; i++) {
      if (tokenToOccasion[i] == _occasionId && 
          _ownerOf(i) == msg.sender && 
          hasCheckedIn[i]) {
          hasValidCheckedInTicket = true;
          break;
      }
  }
  require(hasValidCheckedInTicket, "No checked-in ticket found");
  ```

#### `canClaimPOAP(uint256 _occasionId, address _user)`
- **修改**: 从检查"活动是否结束"改为检查"是否有已检票的门票"

---

## 🚀 使用流程

### 用户端流程

1. **购买门票**
   ```javascript
   await ticketContract.mint(occasionId, seatNumber, { value: ticketPrice });
   ```

2. **查看二维码**
   - 在"我的门票"页面点击"显示二维码"
   - 二维码包含 `tokenId` 和合约地址信息

3. **现场检票**
   - 组织者扫描二维码
   - 系统调用 `checkIn(tokenId)`
   - 检票成功后显示"✅ 已检票"

4. **领取 POAP**
   - 检票后，"领取 POAP"按钮变为可用
   - 点击按钮调用 `claimPOAP(occasionId)`
   - 领取成功后可在"我的 POAP"页面查看

### 组织者端流程

1. **创建活动**
   ```javascript
   await ticketContract.list(
     name, cost, maxTickets, date, time, location,
     resellable, eventEndTime, publicSaleStart, poapEnabled
   );
   ```

2. **检票操作**
   - 使用检票应用扫描用户二维码
   - 获取 `tokenId`
   - 调用 `checkIn(tokenId)`
   - 显示检票结果

---

## 📱 前端集成

### 1. 二维码生成

```typescript
import QRCode from 'qrcode';

const generateTicketQRCode = async (tokenId: string) => {
  const qrData = JSON.stringify({
    tokenId,
    contract: CONTRACT_ADDRESS,
    type: 'ticket-checkin',
    network: 'sepolia'
  });
  
  const qrCodeUrl = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return qrCodeUrl;
};
```

### 2. "我的门票"页面修改

```typescript
// 显示检票状态
const isCheckedIn = await contract.isCheckedIn(tokenId);

// 显示二维码按钮
<button onClick={() => showQRCode(tokenId)}>
  📱 显示二维码
</button>

// 显示检票状态
{isCheckedIn ? (
  <span className="text-green-400">✅ 已检票</span>
) : (
  <span className="text-yellow-400">⏳ 未检票</span>
)}

// 领取 POAP 按钮（只有检票后才可用）
{isCheckedIn && !hasClaimed && (
  <button onClick={() => claimPOAP(occasionId)}>
    🎁 领取 POAP
  </button>
)}
```

### 3. 检票页面（组织者使用）

```typescript
// 扫描二维码
const handleScan = async (qrData: string) => {
  const data = JSON.parse(qrData);
  const { tokenId } = data;
  
  // 调用检票函数
  const tx = await contract.checkIn(tokenId);
  await tx.wait();
  
  alert('✅ 检票成功！');
};

// 使用 react-qr-scanner 或类似库
<QrScanner
  onDecode={handleScan}
  onError={(error) => console.error(error)}
/>
```

### 4. 合约 ABI 更新

需要在 `frontend/config/contract.ts` 中添加新函数的 ABI：

```typescript
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
```

---

## 🧪 测试

### 本地测试
```bash
npx hardhat run scripts/test-checkin.js
```

### Sepolia 测试网部署
```bash
npx hardhat run scripts/deploy-with-poap.js --network sepolia
```

---

## 📊 数据流程图

```
用户购票
   ↓
获得 NFT 门票 (tokenId)
   ↓
前端生成二维码 (包含 tokenId)
   ↓
现场出示二维码
   ↓
组织者扫描二维码
   ↓
调用 checkIn(tokenId)
   ↓
hasCheckedIn[tokenId] = true
   ↓
用户可以领取 POAP
   ↓
调用 claimPOAP(occasionId)
   ↓
检查是否有已检票的门票
   ↓
铸造 POAP Token
```

---

## ⚠️ 注意事项

1. **权限控制**: 只有活动组织者可以检票
2. **重复检票**: 每张票只能检票一次
3. **转让限制**: 门票转让后，检票状态不会转移（绑定 tokenId）
4. **Gas 优化**: `claimPOAP` 中的循环可能消耗较多 gas，建议限制每个用户持有的同一活动门票数量
5. **安全性**: 二维码应包含签名或时间戳防止伪造

---

## 🔄 与旧版本的区别

| 功能 | 旧版本 | 新版本 |
|------|--------|--------|
| POAP 领取条件 | 活动结束后 | 检票后 |
| 检票功能 | ❌ 无 | ✅ 有 |
| 二维码 | ❌ 无 | ✅ 有 |
| 组织者权限 | 创建活动 | 创建活动 + 检票 |

---

## 📦 需要安装的前端依赖

```bash
cd frontend
npm install qrcode
npm install @types/qrcode --save-dev
npm install react-qr-scanner  # 用于组织者扫码
```

---

## 🎯 下一步

1. ✅ 合约已修改完成
2. ⏳ 重新部署到 Sepolia
3. ⏳ 更新前端 ABI
4. ⏳ 实现二维码生成功能
5. ⏳ 实现检票扫码功能
6. ⏳ 更新"我的门票"页面 UI
