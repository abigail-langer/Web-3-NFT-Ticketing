const hre = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("开始部署 NFT Ticketing 系统（含POAP）");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ========== 1. 部署 TicketContract ==========
  console.log("📝 步骤 1: 部署 TicketContract...");
  const TicketContract = await hre.ethers.getContractFactory("TicketContract");
  const ticketContract = await TicketContract.deploy("Event Ticket", "TICKET");
  await ticketContract.waitForDeployment();
  const ticketAddress = await ticketContract.getAddress();
  console.log("✅ TicketContract 已部署:", ticketAddress);
  console.log("");

  // ========== 2. 部署 POAPToken ==========
  console.log("📝 步骤 2: 部署 POAPToken...");
  const POAPToken = await hre.ethers.getContractFactory("POAPToken");
  const poapToken = await POAPToken.deploy(
    "Event Attendance POAP",
    "POAP",
    "ipfs://QmPOAP/" // 可以后续修改
  );
  await poapToken.waitForDeployment();
  const poapAddress = await poapToken.getAddress();
  console.log("✅ POAPToken 已部署:", poapAddress);
  console.log("");

  // ========== 3. 配置合约关联 ==========
  console.log("📝 步骤 3: 配置合约关联...");
  
  // 3.1 设置 TicketContract 的 POAP 合约地址
  const tx1 = await ticketContract.setPOAPContract(poapAddress);
  await tx1.wait();
  console.log("✅ TicketContract 已关联 POAPToken");

  // 3.2 授权 TicketContract 为 POAP 铸造者
  const tx2 = await poapToken.addMinter(ticketAddress);
  await tx2.wait();
  console.log("✅ TicketContract 已授权为 POAP 铸造者");
  console.log("");

  // ========== 4. 创建测试活动 ==========
  console.log("📝 步骤 4: 创建测试活动...");
  
  const now = Math.floor(Date.now() / 1000);
  const publicSaleStart = now + 3600; // 1小时后公开售票
  const eventEndTime = now + 86400 * 7; // 7天后活动结束

  const tx3 = await ticketContract.list(
    "Web3 Conference 2025",           // name
    hre.ethers.parseEther("0.01"),    // cost (0.01 ETH)
    100,                               // maxTickets
    "2025-12-01",                      // date
    "14:00",                           // time
    "Shanghai, China",                 // location
    true,                              // resellable
    eventEndTime,                      // eventEndTime
    publicSaleStart,                   // publicSaleStart
    true                               // poapEnabled
  );
  await tx3.wait();
  console.log("✅ 测试活动已创建 (ID: 1)");
  console.log("   - 名称: Web3 Conference 2025");
  console.log("   - 价格: 0.01 ETH");
  console.log("   - 座位数: 100");
  console.log("   - 可转卖: 是");
  console.log("   - POAP奖励: 启用");
  console.log("   - 公开售票时间:", new Date(publicSaleStart * 1000).toLocaleString());
  console.log("");

  // ========== 5. 设置优先座位 ==========
  console.log("📝 步骤 5: 设置优先座位（POAP持有者专属）...");
  const prioritySeats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 前10个座位
  const tx4 = await ticketContract.setPrioritySeats(1, prioritySeats);
  await tx4.wait();
  console.log("✅ 已设置优先座位:", prioritySeats.join(", "));
  console.log("");

  // ========== 6. 等待区块确认 ==========
  console.log("📝 步骤 6: 等待区块确认...");
  await ticketContract.deploymentTransaction().wait(3);
  await poapToken.deploymentTransaction().wait(3);
  console.log("✅ 区块已确认");
  console.log("");

  // ========== 7. 输出部署信息 ==========
  console.log("========================================");
  console.log("🎉 部署完成！");
  console.log("========================================");
  console.log("");
  console.log("📋 合约地址:");
  console.log("   TicketContract:", ticketAddress);
  console.log("   POAPToken:     ", poapAddress);
  console.log("");
  console.log("🔗 区块浏览器:");
  console.log("   TicketContract:", `https://sepolia.etherscan.io/address/${ticketAddress}`);
  console.log("   POAPToken:     ", `https://sepolia.etherscan.io/address/${poapAddress}`);
  console.log("");
  console.log("📝 配置信息:");
  console.log("   - TicketContract 已关联 POAPToken");
  console.log("   - POAPToken 已授权 TicketContract 为铸造者");
  console.log("   - 测试活动已创建 (ID: 1)");
  console.log("   - 优先座位已设置 (座位 1-10)");
  console.log("");

  // ========== 8. 保存部署信息 ==========
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      TicketContract: {
        address: ticketAddress,
        name: "Event Ticket",
        symbol: "TICKET"
      },
      POAPToken: {
        address: poapAddress,
        name: "Event Attendance POAP",
        symbol: "POAP"
      }
    },
    testEvent: {
      id: 1,
      name: "Web3 Conference 2025",
      cost: "0.01",
      maxTickets: 100,
      publicSaleStart: publicSaleStart,
      eventEndTime: eventEndTime,
      prioritySeats: prioritySeats
    }
  };

  fs.writeFileSync(
    "deployment-info-with-poap.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("✅ 部署信息已保存到 deployment-info-with-poap.json");
  console.log("");

  // ========== 9. 验证合约（可选） ==========
  if (hre.network.name === "sepolia") {
    console.log("📝 开始验证合约...");
    try {
      await hre.run("verify:verify", {
        address: ticketAddress,
        constructorArguments: ["Event Ticket", "TICKET"],
      });
      console.log("✅ TicketContract 验证成功");

      await hre.run("verify:verify", {
        address: poapAddress,
        constructorArguments: ["Event Attendance POAP", "POAP", "ipfs://QmPOAP/"],
      });
      console.log("✅ POAPToken 验证成功");
    } catch (error) {
      console.log("⚠️  合约验证失败:", error.message);
      console.log("   你可以稍后手动验证");
    }
  }

  console.log("");
  console.log("========================================");
  console.log("🚀 系统已就绪！");
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
