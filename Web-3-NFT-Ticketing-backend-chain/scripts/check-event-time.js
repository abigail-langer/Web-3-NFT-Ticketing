const { ethers } = require("hardhat");

async function main() {
  const TICKET_CONTRACT = "0x0a1483D870b7Bc2fFC9Ab6e63280e72C8c768659";
  
  const TicketContract = await ethers.getContractAt("TicketContract", TICKET_CONTRACT);
  
  console.log("========================================");
  console.log("📅 活动时间查询");
  console.log("========================================\n");
  
  const occasion = await TicketContract.getOccasion(1);
  
  const now = Math.floor(Date.now() / 1000);
  const publicSaleStart = Number(occasion.publicSaleStart);
  const eventEndTime = Number(occasion.eventEndTime);
  
  console.log("🎫 活动名称:", occasion.name);
  console.log("📍 活动地点:", occasion.location);
  console.log("📅 活动日期:", occasion.date);
  console.log("🕐 活动时间:", occasion.time);
  console.log("");
  
  console.log("⏰ 当前时间:");
  console.log("   ", new Date(now * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log("");
  
  console.log("🔓 公开售票时间:");
  console.log("   ", new Date(publicSaleStart * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  if (now >= publicSaleStart) {
    console.log("   ✅ 已开始公开售票");
  } else {
    const timeLeft = publicSaleStart - now;
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    console.log(`   ⏳ 还需等待 ${hours} 小时 ${minutes} 分钟`);
  }
  console.log("");
  
  console.log("🏁 活动结束时间:");
  console.log("   ", new Date(eventEndTime * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  if (now >= eventEndTime) {
    console.log("   ✅ 活动已结束，可以领取 POAP");
  } else {
    const timeLeft = eventEndTime - now;
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    console.log(`   ⏳ 还需等待 ${days} 天 ${hours} 小时 ${minutes} 分钟`);
  }
  console.log("");
  
  console.log("🎖️  POAP 状态:");
  console.log("   启用:", occasion.poapEnabled ? "✅ 是" : "❌ 否");
  console.log("   可领取:", (now >= eventEndTime && occasion.poapEnabled) ? "✅ 是" : "❌ 否");
  console.log("");
  
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
