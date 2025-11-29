const { ethers } = require("hardhat");

async function main() {
  const [organizer, user] = await ethers.getSigners();
  
  console.log("========================================");
  console.log("🎫 检票功能测试");
  console.log("========================================\n");
  
  console.log("账户信息:");
  console.log("  组织者:", organizer.address);
  console.log("  用户:", user.address);
  console.log("");
  
  // 部署合约
  console.log("📝 步骤 1: 部署合约...");
  const TicketContract = await ethers.getContractFactory("TicketContract");
  const ticketContract = await TicketContract.deploy("Event Ticket", "TICKET");
  await ticketContract.waitForDeployment();
  const ticketAddress = await ticketContract.getAddress();
  console.log("✅ TicketContract 已部署:", ticketAddress);
  console.log("");
  
  const POAPToken = await ethers.getContractFactory("POAPToken");
  const poapToken = await POAPToken.deploy("Event Attendance POAP", "POAP");
  await poapToken.waitForDeployment();
  const poapAddress = await poapToken.getAddress();
  console.log("✅ POAPToken 已部署:", poapAddress);
  console.log("");
  
  // 关联合约
  console.log("📝 步骤 2: 关联合约...");
  await ticketContract.setPOAPContract(poapAddress);
  await poapToken.setMinter(ticketAddress);
  console.log("✅ 合约已关联");
  console.log("");
  
  // 创建活动
  console.log("📝 步骤 3: 创建测试活动...");
  const now = Math.floor(Date.now() / 1000);
  await ticketContract.list(
    "Test Event",
    ethers.parseEther("0.01"),
    10,
    "2025-12-01",
    "14:00",
    "Test Location",
    true,
    now + 86400,
    now + 3600,
    true
  );
  console.log("✅ 活动已创建 (ID: 1)");
  console.log("");
  
  // 用户购票
  console.log("📝 步骤 4: 用户购买门票...");
  const userContract = ticketContract.connect(user);
  const tx = await userContract.mint(1, 1, { value: ethers.parseEther("0.01") });
  await tx.wait();
  console.log("✅ 用户已购买座位 1 的门票 (Token ID: 1)");
  console.log("");
  
  // 检查检票状态
  console.log("📝 步骤 5: 检查检票状态...");
  let isCheckedIn = await ticketContract.isCheckedIn(1);
  console.log("  检票状态:", isCheckedIn ? "✅ 已检票" : "❌ 未检票");
  console.log("");
  
  // 组织者检票
  console.log("📝 步骤 6: 组织者进行检票...");
  const checkInTx = await ticketContract.checkIn(1);
  await checkInTx.wait();
  console.log("✅ 检票成功！");
  console.log("");
  
  // 再次检查检票状态
  console.log("📝 步骤 7: 再次检查检票状态...");
  isCheckedIn = await ticketContract.isCheckedIn(1);
  console.log("  检票状态:", isCheckedIn ? "✅ 已检票" : "❌ 未检票");
  console.log("");
  
  // 检查是否可以领取 POAP
  console.log("📝 步骤 8: 检查是否可以领取 POAP...");
  const canClaim = await ticketContract.canClaimPOAP(1, user.address);
  console.log("  可以领取 POAP:", canClaim ? "✅ 是" : "❌ 否");
  console.log("");
  
  // 用户领取 POAP
  if (canClaim) {
    console.log("📝 步骤 9: 用户领取 POAP...");
    const claimTx = await userContract.claimPOAP(1);
    await claimTx.wait();
    console.log("✅ POAP 领取成功！");
    
    const poapBalance = await poapToken.balanceOf(user.address);
    console.log("  用户 POAP 余额:", poapBalance.toString());
  }
  
  console.log("");
  console.log("========================================");
  console.log("🎉 测试完成！");
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
