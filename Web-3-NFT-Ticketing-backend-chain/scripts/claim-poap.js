const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("使用账户:", signer.address);

  // 合约地址
  const TICKET_CONTRACT = "0x0a1483D870b7Bc2fFC9Ab6e63280e72C8c768659";
  const POAP_CONTRACT = "0xbCbc2Aa8489664b329AE634755a63C0621bc55d7";

  // 连接到 TicketContract
  const TicketContract = await ethers.getContractAt("TicketContract", TICKET_CONTRACT);
  const POAPToken = await ethers.getContractAt("POAPToken", POAP_CONTRACT);

  // 要领取的活动 ID
  const occasionId = 1;

  console.log("\n📋 检查活动信息...");
  const occasion = await TicketContract.getOccasion(occasionId);
  console.log("活动名称:", occasion.name);
  console.log("POAP 已启用:", occasion.poapEnabled);
  console.log("活动结束时间:", new Date(Number(occasion.eventEndTime) * 1000).toLocaleString());
  
  const now = Math.floor(Date.now() / 1000);
  const eventEnded = now >= Number(occasion.eventEndTime);
  console.log("活动是否已结束:", eventEnded ? "✅ 是" : "❌ 否");

  if (!eventEnded) {
    console.log("\n⚠️  活动尚未结束，无法领取 POAP");
    console.log("请等待活动结束后再领取");
    return;
  }

  console.log("\n🎖️  开始领取 POAP...");
  
  try {
    const tx = await TicketContract.claimPOAP(occasionId);
    console.log("交易已发送:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ POAP 领取成功！");
    console.log("区块号:", receipt.blockNumber);

    // 检查 POAP 余额
    const balance = await POAPToken.balanceOf(signer.address);
    console.log("\n🎉 你现在拥有", balance.toString(), "个 POAP!");

    // 获取最新的 POAP Token ID
    if (balance > 0) {
      const tokenId = await POAPToken.tokenOfOwnerByIndex(signer.address, balance - 1n);
      const tokenURI = await POAPToken.tokenURI(tokenId);
      console.log("\n最新 POAP 信息:");
      console.log("Token ID:", tokenId.toString());
      console.log("Token URI:", tokenURI);
    }

  } catch (error) {
    console.error("\n❌ 领取失败:", error.message);
    
    if (error.message.includes("Already claimed")) {
      console.log("你已经领取过这个活动的 POAP 了！");
    } else if (error.message.includes("Event not ended")) {
      console.log("活动尚未结束，请稍后再试");
    } else if (error.message.includes("Must own ticket")) {
      console.log("你必须先购买这个活动的门票才能领取 POAP");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
