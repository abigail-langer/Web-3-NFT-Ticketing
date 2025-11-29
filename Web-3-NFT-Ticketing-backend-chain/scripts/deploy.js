const hre = require("hardhat")

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

async function main() {
  // Setup accounts & variables
  const [deployer] = await ethers.getSigners()
  const NAME = "TokenMaster"
  const SYMBOL = "TM"

  // Deploy contract
  const TicketContract = await ethers.getContractFactory("TicketContract")
  const ticketContract = await TicketContract.deploy(NAME, SYMBOL)
  await ticketContract.waitForDeployment()

  console.log(`Deployed TicketContract Contract at: ${await ticketContract.getAddress()}\n`)

  // List 5 events (注意：从组织者直接购买门票免费，只需gas费，所以cost设为0)
  const occasions = [
    {
      name: "UFC Miami",
      cost: tokens(0),  // 从组织者直接购买免费
      tickets: 100,
      date: "May 31",
      time: "6:00PM EST",
      location: "Miami-Dade Arena - Miami, FL",
      resellable: true  // 允许转卖
    },
    {
      name: "ETH Tokyo",
      cost: tokens(0),
      tickets: 125,
      date: "Jun 2",
      time: "1:00PM JST",
      location: "Tokyo, Japan",
      resellable: true
    },
    {
      name: "ETH Privacy Hackathon",
      cost: tokens(0),
      tickets: 200,
      date: "Jun 9",
      time: "10:00AM TRT",
      location: "Turkey, Istanbul",
      resellable: false  // 不允许转卖
    },
    {
      name: "Dallas Mavericks vs. San Antonio Spurs",
      cost: tokens(0),
      tickets: 150,
      date: "Jun 11",
      time: "2:30PM CST",
      location: "American Airlines Center - Dallas, TX",
      resellable: true
    },
    {
      name: "ETH Global Toronto",
      cost: tokens(0),
      tickets: 125,
      date: "Jun 23",
      time: "11:00AM EST",
      location: "Toronto, Canada",
      resellable: true
    }
  ]

  for (var i = 0; i < 5; i++) {
    const transaction = await ticketContract.connect(deployer).list(
      occasions[i].name,
      occasions[i].cost,
      occasions[i].tickets,
      occasions[i].date,
      occasions[i].time,
      occasions[i].location,
      occasions[i].resellable
    )

    await transaction.wait()

    console.log(`Listed Event ${i + 1}: ${occasions[i].name} (Resellable: ${occasions[i].resellable})`)
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});