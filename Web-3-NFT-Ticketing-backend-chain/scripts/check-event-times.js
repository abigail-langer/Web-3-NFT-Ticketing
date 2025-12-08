const hre = require("hardhat");

async function main() {
  console.log('\n⏳ 等待 10 秒以避免 RPC 限制...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));

  const fs = require('fs');
  const deploymentInfo = JSON.parse(
    fs.readFileSync('./deployment-info-with-poap.json', 'utf8')
  );

  const ticketAddress = deploymentInfo.contracts.TicketContract.address;
  const TicketContract = await hre.ethers.getContractAt("TicketContract", ticketAddress);

  console.log('========================================');
  console.log('检查活动销售时间设置');
  console.log('========================================\n');

  // 获取当前时间
  const now = Math.floor(Date.now() / 1000);
  console.log(`当前时间戳: ${now}`);
  console.log(`当前时间: ${new Date(now * 1000).toLocaleString()}\n`);

  // 获取总活动数
  const totalOccasions = await TicketContract.totalOccasions();
  console.log(`总活动数: ${totalOccasions}\n`);

  // 检查每个活动的时间设置
  for (let i = 1; i <= totalOccasions; i++) {
    console.log(`\n========== 活动 #${i} ==========`);

    try {
      const occasion = await TicketContract.getOccasion(i);

      console.log(`活动名称: ${occasion.name}`);
      console.log(`POAP启用: ${occasion.poapEnabled ? '是' : '否'}`);
      console.log(`可转售: ${occasion.resellable ? '是' : '否'}`);
      console.log(`剩余票数: ${occasion.tickets} / ${occasion.maxTickets}`);

      // 时间信息
      console.log('\n⏰ 时间设置:');

      // 早鸟期开始时间
      if (occasion.earlySaleStart && occasion.earlySaleStart > 0n) {
        const earlyStart = Number(occasion.earlySaleStart);
        console.log(`早鸟期开始: ${new Date(earlyStart * 1000).toLocaleString()}`);
        console.log(`  时间戳: ${earlyStart}`);
        if (now < earlyStart) {
          console.log(`  ⏳ 距离开始: ${Math.floor((earlyStart - now) / 60)} 分钟`);
        } else {
          console.log(`  ✅ 已开始 (${Math.floor((now - earlyStart) / 60)} 分钟前)`);
        }
      } else {
        console.log(`早鸟期开始: 未设置`);
      }

      // 公开销售开始时间
      if (occasion.publicSaleStart && occasion.publicSaleStart > 0n) {
        const publicStart = Number(occasion.publicSaleStart);
        console.log(`公开销售开始: ${new Date(publicStart * 1000).toLocaleString()}`);
        console.log(`  时间戳: ${publicStart}`);
        if (now < publicStart) {
          console.log(`  ⏳ 距离开始: ${Math.floor((publicStart - now) / 60)} 分钟`);
        } else {
          console.log(`  ✅ 已开始 (${Math.floor((now - publicStart) / 60)} 分钟前)`);
        }
      } else {
        console.log(`公开销售开始: 未设置`);
      }

      // 活动结束时间
      if (occasion.eventEndTime && occasion.eventEndTime > 0n) {
        const eventEnd = Number(occasion.eventEndTime);
        console.log(`活动结束: ${new Date(eventEnd * 1000).toLocaleString()}`);
        console.log(`  时间戳: ${eventEnd}`);
        if (now < eventEnd) {
          console.log(`  ⏳ 距离结束: ${Math.floor((eventEnd - now) / 3600)} 小时`);
        } else {
          console.log(`  ❌ 已结束 (${Math.floor((now - eventEnd) / 3600)} 小时前)`);
        }
      } else {
        console.log(`活动结束: 未设置`);
      }

      // 判断当前销售阶段
      console.log('\n📊 当前销售阶段:');
      const earlyStart = Number(occasion.earlySaleStart || 0n);
      const publicStart = Number(occasion.publicSaleStart || 0n);
      const eventEnd = Number(occasion.eventEndTime || 0n);

      if (eventEnd > 0 && now > eventEnd) {
        console.log('  ❌ 活动已结束');
      } else if (earlyStart > 0 && now >= earlyStart && now < publicStart) {
        console.log('  🐦 早鸟期 (只有5+ POAP持有者可购买)');
      } else if (now >= publicStart) {
        console.log('  🎉 公开销售 (所有人可购买,优先座位需POAP)');
      } else {
        console.log('  ⏳ 销售未开始');
      }

      // 优先座位
      const prioritySeats = await TicketContract.getPrioritySeats(i);
      console.log(`\n⭐ 优先座位 (需5+ POAP): ${prioritySeats.length > 0 ? prioritySeats.slice(0, 10).join(', ') + (prioritySeats.length > 10 ? '...' : '') : '无'}`);

    } catch (error) {
      console.error(`❌ 检查活动 ${i} 失败:`, error.message);
    }
  }

  console.log('\n========================================');
  console.log('✅ 检查完成！');
  console.log('========================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
