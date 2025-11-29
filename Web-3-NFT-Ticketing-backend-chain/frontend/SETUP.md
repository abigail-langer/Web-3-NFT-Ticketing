# NFT Ticket System - Frontend Setup Guide

## 🎯 已完成的功能

### ✅ 智能合约功能
1. **活动创建** - 组织者可以创建活动并设置是否允许转卖
2. **一级市场购票** - 用户从组织者处购买门票（免费，只需gas费）
3. **二级市场挂单** - 用户可以将可转卖的门票挂单出售
4. **二级市场购买** - 用户可以从二级市场购买门票
5. **手续费分配** - 二级市场交易自动分配：
   - 平台手续费：2.5%
   - 组织者版税：5%
   - 卖家收益：92.5%

### ✅ 前端页面
1. **首页** (`/`) - 展示所有活动列表
2. **活动详情** (`/events/[id]`) - 选座位并购买门票
3. **我的门票** (`/my-tickets`) - 查看拥有的门票，挂单/取消挂单
4. **二级市场** (`/market`) - 浏览并购买二级市场的门票
5. **创建活动** (`/create-event`) - 组织者创建新活动

## 📋 前置要求

- Node.js 18+ 
- MetaMask 或其他 Web3 钱包
- Sepolia 测试网 ETH（用于 gas 费）

## 🚀 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量（可选）

创建 `.env.local` 文件：

```bash
# WalletConnect Project ID (可选，用于移动端钱包连接)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**注意**：如果不配置 WalletConnect，前端仍然可以正常工作，只是无法使用 WalletConnect 连接移动端钱包。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 连接钱包

1. 点击右上角 "Connect Wallet"
2. 选择 MetaMask 或其他钱包
3. 确保切换到 **Sepolia Testnet**
4. 如果网络不对，页面顶部会提示切换

## 🎮 使用流程

### 作为活动组织者

1. **创建活动**
   - 点击 "Create Event" 按钮
   - 填写活动信息（名称、日期、地点等）
   - 设置票价（设为 0 表示免费，只需 gas）
   - 选择是否允许转卖
   - 提交交易

2. **收益管理**
   - 一级市场：直接收到用户支付的票价
   - 二级市场：自动获得 5% 版税

### 作为购票用户

1. **购买门票（一级市场）**
   - 浏览首页活动列表
   - 点击 "Buy Ticket" 进入活动详情
   - 选择座位（绿色=可选，红色=已售，蓝色=空闲）
   - 点击购买并确认交易
   - 只需支付 gas 费（如果票价为 0）

2. **查看我的门票**
   - 点击 "My Tickets"
   - 查看所有拥有的门票
   - 可以看到 Token ID、座位号、活动信息

3. **在二级市场出售**
   - 在 "My Tickets" 页面
   - 点击 "List for Sale"（仅可转卖的门票）
   - 输入价格（ETH）
   - 确认交易
   - 门票将出现在二级市场

4. **取消挂单**
   - 在 "My Tickets" 页面
   - 点击 "Remove Listing"
   - 确认交易

5. **从二级市场购买**
   - 访问 "Marketplace" 或点击活动卡片的 "Marketplace"
   - 浏览挂单的门票
   - 点击 "Buy Now"
   - 支付价格 + 手续费（自动计算）

## 🔧 技术栈

- **框架**: Next.js 15 + React 18 + TypeScript
- **Web3**: Wagmi v2 + Viem + RainbowKit
- **样式**: Tailwind CSS
- **网络**: Ethereum Sepolia Testnet
- **合约**: ERC-721 + 自定义市场逻辑

## 📝 合约信息

- **合约地址**: `0x34f11d70FF29540D1824bEE46Cfec7925Bc83265`
- **网络**: Sepolia Testnet (Chain ID: 11155111)
- **浏览器**: https://sepolia.etherscan.io/address/0x34f11d70FF29540D1824bEE46Cfec7925Bc83265

## 🐛 常见问题

### 1. 钱包连接失败
- 确保安装了 MetaMask 或其他 Web3 钱包
- 刷新页面重试

### 2. 网络错误
- 确保钱包切换到 Sepolia 测试网
- 点击页面顶部的 "Switch to Sepolia" 按钮

### 3. 交易失败
- 确保钱包有足够的 Sepolia ETH
- 检查 gas 费设置
- 查看浏览器控制台的错误信息

### 4. 获取测试 ETH
- https://sepoliafaucet.com
- https://faucet.quicknode.com/ethereum/sepolia

### 5. 门票不显示
- 等待区块确认（通常 15-30 秒）
- 刷新页面
- 检查交易是否成功

## 🎨 页面截图说明

### 首页
- 展示所有活动
- 显示可用票数、价格、是否可转卖
- 快速跳转到购买或市场页面

### 活动详情
- 座位图可视化
- 实时显示已售座位
- 一键购买

### 我的门票
- NFT 票据列表
- 挂单/取消挂单
- 显示挂单状态和价格

### 二级市场
- 所有挂单门票
- 显示卖家、价格、手续费
- 一键购买

### 创建活动
- 表单填写活动信息
- 设置票价和转卖权限
- 实时交易状态

## 📦 构建生产版本

```bash
npm run build
npm run start
```

## 🔗 相关链接

- Sepolia Faucet: https://sepoliafaucet.com
- Etherscan: https://sepolia.etherscan.io
- Wagmi Docs: https://wagmi.sh
- RainbowKit Docs: https://www.rainbowkit.com

## 💡 提示

1. 所有交易都在 Sepolia 测试网上，使用的是测试 ETH，没有真实价值
2. 从组织者直接购买门票是免费的（只需 gas 费）
3. 二级市场会收取手续费（平台 2.5% + 组织者 5%）
4. 只有标记为"可转卖"的门票才能在二级市场交易
5. 每个门票都是独一无二的 NFT，有唯一的 Token ID
