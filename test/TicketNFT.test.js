const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketNFT", function () {
  async function deploy() {
    const [owner, alice] = await ethers.getSigners();
    const Ticket = await ethers.getContractFactory("TicketNFT");
    const ticket = await Ticket.deploy("BaseTicket", "BTKT", "ipfs://CID/");
    await ticket.createEvent(1, "Demo", 2, "ipfs://CID/events/1/");
    return { ticket, owner, alice };
  }

  it("mint/transfer/verify", async () => {
    const { ticket, owner, alice } = await deploy();
    const tx = await ticket.mintTicket(alice.address, 1);
    const r = await tx.wait();
    const tokenId = r.logs.find(l => l.fragment?.name==="Transfer").args.tokenId;

    expect(await ticket.ownerOf(tokenId)).to.eq(alice.address);
    await ticket.connect(alice)["safeTransferFrom(address,address,uint256)"](alice.address, owner.address, tokenId);
    expect(await ticket.ownerOf(tokenId)).to.eq(owner.address);

    const [valid, eventId, ownerNow] = await ticket.isValidTicket(tokenId);
    expect(valid).to.eq(true);
    expect(eventId).to.eq(1);
    expect(ownerNow).to.eq(owner.address);
  });
});
