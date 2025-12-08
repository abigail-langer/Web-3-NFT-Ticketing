const hre = require("hardhat");

async function main() {
  // 从命令行参数获取地址，或使用默认部署账户
  const userAddress = process.argv[2] || (await hre.ethers.getSigners())[0].address;

  // 从部署信息文件读取合约地址
  const fs = require('fs');
  const deploymentInfo = JSON.parse(
    fs.readFileSync('./deployment-info-with-poap.json', 'utf8')
  );

  const poapAddress = deploymentInfo.contracts.POAPToken.address;
  const ticketAddress = deploymentInfo.contracts.TicketContract.address;

  console.log('\n========================================');
  console.log('POAP 徽章余额查询');
  console.log('========================================\n');

  // 连接到 POAP 合约
  const POAPToken = await hre.ethers.getContractAt("POAPToken", poapAddress);

  // 查询余额
  const balance = await POAPToken.balanceOf(userAddress);

  console.log(`📍 查询地址: ${userAddress}`);
  console.log(`🎖️  POAP 徽章数量: ${balance.toString()}`);
  console.log(`\n✅ ${balance >= 5n ? '符合' : '不符合'}优先购票资格 (需要 5+ 徽章)`);

  // 如果有徽章，显示徽章详情
  if (balance > 0n) {
    console.log(`\n📋 徽章列表:`);
    for (let i = 0n; i < balance; i++) {
      try {
        const tokenId = await POAPToken.tokenOfOwnerByIndex(userAddress, i);
        const tokenURI = await POAPToken.tokenURI(tokenId);
        console.log(`   ${Number(i) + 1}. Token ID: ${tokenId} - URI: ${tokenURI}`);
      } catch (error) {
        console.log(`   ${Number(i) + 1}. Token ID: 无法读取`);
      }
    }
  }

  console.log('\n========================================');
  console.log(`🔗 在区块浏览器查看: https://sepolia.etherscan.io/address/${userAddress}#tokentxnsErc721`);
  console.log('========================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
