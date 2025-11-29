const { ethers } = require("hardhat");

// Usage：TICKET_ADDRESS=0x... TOKEN_ID=1 npx hardhat run scripts/verifyTicket.js --network baseSepolia
async function main() {
  const addr = process.env.TICKET_ADDRESS;
  const tokenId = BigInt(process.env.TOKEN_ID);

  if (!addr || !tokenId) throw new Error("need TICKET_ADDRESS & TOKEN_ID");

  const ticket = await ethers.getContractAt("TicketNFT", addr);
  const [valid, eventId, owner] = await ticket.isValidTicket(tokenId);
  console.log({ valid, eventId: eventId.toString(), owner });
}

main().catch((e)=>{console.error(e);process.exit(1);});
