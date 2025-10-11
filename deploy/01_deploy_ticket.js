const { ethers } = require("hardhat");

async function main() {
  const name = "BaseTicket";
  const symbol = "BTKT";
  const baseURI = "ipfs://GLOBAL_CID/"; // Can be left blank or customized

  const Ticket = await ethers.getContractFactory("TicketNFT");
  const ticket = await Ticket.deploy(name, symbol, baseURI);
  await ticket.waitForDeployment();

  const addr = await ticket.getAddress();
  console.log("TicketNFT deployed:", addr);

  // Create a sample activity：eventId=1
  const tx = await ticket.createEvent(1, "Demo Event", 1000, "ipfs://EVENT1_CID/");
  await tx.wait();
  console.log("Event 1 created.");
}

main().catch((e) => { console.error(e); process.exit(1); });
