const hre = require("hardhat");

async function main() {
  console.log('\n⏳ 等待 10 秒以避免 RPC 限制...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));

  const fs = require('fs');
  const deploymentInfo = JSON.parse(
    fs.readFileSync('./deployment-info-with-poap.json', 'utf8')
  );

  const ticketAddress = deploymentInfo.contracts.TicketContract.address;
  const [deployer] = await hre.ethers.getSigners();

  console.log('========================================');
  console.log('检查和设置优先座位');
  console.log('========================================\n');
  console.log(`合约地址: ${ticketAddress}`);
  console.log(`操作账户: ${deployer.address}\n`);

  const TicketContract = await hre.ethers.getContractAt("TicketContract", ticketAddress);

  // 获取总活动数
  const totalOccasions = await TicketContract.totalOccasions();
  console.log(`总活动数: ${totalOccasions}\n`);

  // 检查每个活动的优先座位
  for (let i = 1; i <= totalOccasions; i++) {
    console.log(`\n--- 活动 #${i} ---`);

    try {
      // 获取活动信息
      const occasion = await TicketContract.getOccasion(i);
      console.log(`活动名称: ${occasion.name}`);
      console.log(`POAP启用: ${occasion.poapEnabled ? '是' : '否'}`);

      // 获取优先座位
      const prioritySeats = await TicketContract.getPrioritySeats(i);
      console.log(`优先座位: ${prioritySeats.length > 0 ? prioritySeats.join(', ') : '无'}`);

      // 如果启用了POAP但没有设置优先座位,询问是否设置
      if (occasion.poapEnabled && prioritySeats.length === 0) {
        console.log('\n⚠️  此活动启用了POAP但未设置优先座位');
        console.log('正在设置座位 1-10 为优先座位...');

        const seats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const tx = await TicketContract.setPrioritySeats(i, seats);
        await tx.wait();

        console.log('✅ 优先座位已设置:', seats.join(', '));
        console.log(`交易哈希: ${tx.hash}`);
      }
    } catch (error) {
      console.error(`❌ 检查活动 ${i} 失败:`, error.message);
    }
  }

  console.log('\n========================================');
  console.log('✅ 完成！');
  console.log('========================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
