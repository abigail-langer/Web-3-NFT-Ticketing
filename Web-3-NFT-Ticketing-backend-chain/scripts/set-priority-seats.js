const hre = require("hardhat");

async function main() {
  console.log('\n⏳ 等待 20 秒以避免 RPC 限制...\n');
  await new Promise(resolve => setTimeout(resolve, 20000));

  const fs = require('fs');
  const deploymentInfo = JSON.parse(
    fs.readFileSync('./deployment-info-with-poap.json', 'utf8')
  );

  const ticketAddress = deploymentInfo.contracts.TicketContract.address;
  const [deployer] = await hre.ethers.getSigners();

  console.log('========================================');
  console.log('设置优先座位');
  console.log('========================================\n');
  console.log(`合约地址: ${ticketAddress}`);
  console.log(`操作账户: ${deployer.address}\n`);

  const TicketContract = await hre.ethers.getContractAt("TicketContract", ticketAddress);

  // 设置座位 1-10 为优先座位
  const prioritySeats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  console.log('⏳ 正在设置优先座位...');
  const tx = await TicketContract.setPrioritySeats(1, prioritySeats);
  await tx.wait();

  console.log('✅ 优先座位已设置:', prioritySeats.join(', '));
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
