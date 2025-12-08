const hre = require("hardhat");

async function main() {
  // 直接设置接收地址
  const recipientAddress = "0x9bfaa6da0384390cbe0bd42b2eae2c19f6ea4a07";
  const count = 6;

  console.log('\n⏳ 等待 15 秒以避免 RPC 限制...\n');
  await new Promise(resolve => setTimeout(resolve, 15000));

  // 从部署信息文件读取合约地址
  const fs = require('fs');
  const deploymentInfo = JSON.parse(
    fs.readFileSync('./deployment-info-with-poap.json', 'utf8')
  );

  const poapAddress = deploymentInfo.contracts.POAPToken.address;

  console.log('\n========================================');
  console.log('🎖️  铸造测试 POAP 徽章');
  console.log('========================================\n');

  // 连接到合约
  const POAPToken = await hre.ethers.getContractAt("POAPToken", poapAddress);
  const [deployer] = await hre.ethers.getSigners();

  console.log(`📍 接收地址: ${recipientAddress}`);
  console.log(`🔢 铸造数量: ${count}`);
  console.log(`📝 POAP 合约: ${poapAddress}`);
  console.log(`👤 操作账户: ${deployer.address}\n`);

  // 检查当前余额
  const currentBalance = await POAPToken.balanceOf(recipientAddress);
  console.log(`📊 当前徽章数量: ${currentBalance.toString()}\n`);

  // 铸造 POAP（使用不同的模拟活动ID来避免重复）
  console.log(`⏳ 开始铸造 ${count} 个 POAP 徽章...\n`);

  // 使用较大的活动ID，避免与实际活动冲突（从1000开始）
  const baseOccasionId = 1000;

  for (let i = 0; i < count; i++) {
    try {
      const occasionId = baseOccasionId + i;
      const tx = await POAPToken.mintPOAP(recipientAddress, occasionId);
      console.log(`   ${i + 1}. 正在铸造... (活动ID: ${occasionId}, tx: ${tx.hash})`);
      await tx.wait();
      console.log(`   ✅ 铸造成功!`);
    } catch (error) {
      console.error(`   ❌ 铸造失败: ${error.message}`);
    }
  }

  // 检查新余额
  const newBalance = await POAPToken.balanceOf(recipientAddress);
  console.log(`\n========================================`);
  console.log(`✅ 铸造完成!`);
  console.log(`========================================\n`);
  console.log(`📊 新的徽章数量: ${newBalance.toString()}`);
  console.log(`🎯 优先购票资格: ${newBalance >= 5n ? '✅ 符合' : '❌ 不符合'} (需要 5+ 徽章)`);
  console.log(`\n🔗 在区块浏览器查看: https://sepolia.etherscan.io/address/${recipientAddress}#tokentxnsErc721`);
  console.log('========================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
