const { ethers } = require("hardhat");

// Usage：TICKET_ADDRESS=0x... TO=0x... EVENT_ID=1 npx hardhat run scripts/mint.js --network baseSepolia
async function main() {
  const addr = process.env.TICKET_ADDRESS;
  const to = process.env.TO;
  const eventId = Number(process.env.EVENT_ID || 1);

  if (!addr || !to) throw new Error("need TICKET_ADDRESS & TO");

  const ticket = await ethers.getContractAt("TicketNFT", addr);
  const tx = await ticket.mintTicket(to, eventId);
  const receipt = await tx.wait();

  const log = receipt.logs.find((l) => l.fragment?.name === "Transfer");
  const tokenId = log?.args?.tokenId?.toString();
  console.log("Minted tokenId:", tokenId);
}

main().catch((e)=>{console.error(e);process.exit(1);});
