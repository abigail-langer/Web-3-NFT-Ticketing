const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0xD274e66aB4eFa2F520fd3Ab6384d243B59bA4179";
  const USER_ADDRESS = "0x9bfaa6da0384390cbe0bd42b2eae2c19f6ea4a07";

  // Get contract instance
  const contract = await hre.ethers.getContractAt("TicketContract", CONTRACT_ADDRESS);

  console.log(`\n🔍 Checking tickets for user: ${USER_ADDRESS}`);
  console.log(`📋 Contract address: ${CONTRACT_ADDRESS}`);

  // Check total supply
  const totalSupply = await contract.totalSupply();
  console.log(`\n📊 Total tickets minted: ${totalSupply.toString()}`);

  if (totalSupply === 0n) {
    console.log("⚠️  No tickets have been minted yet in this contract");
    return;
  }

  // Check user balance
  const userBalance = await contract.balanceOf(USER_ADDRESS);
  console.log(`👤 User ticket balance: ${userBalance.toString()}`);

  // Try calling getUserTickets
  console.log(`\n📞 Calling getUserTickets...`);
  try {
    const userTickets = await contract.getUserTickets(USER_ADDRESS);
    console.log(`✅ getUserTickets returned ${userTickets.length} tickets`);

    if (userTickets.length > 0) {
      console.log(`🎫 Ticket IDs owned by user:`, userTickets.map(t => t.toString()));

      // Get details for each ticket
      for (let i = 0; i < userTickets.length; i++) {
        const tokenId = userTickets[i];
        const owner = await contract.ownerOf(tokenId);
        const occasion = await contract.getOccasion(await contract.tokenURI(tokenId).catch(() => null));
        console.log(`  - Token ID ${tokenId}: Owner ${owner}`);
      }
    } else {
      console.log(`⚠️  User owns 0 tickets according to getUserTickets`);
    }
  } catch (error) {
    console.error(`❌ Error calling getUserTickets:`, error.message);
  }

  // Manual check: iterate through all tokens to find user's tickets
  console.log(`\n🔎 Manual enumeration (checking all tokens 1-${totalSupply}):`);
  let manualCount = 0;
  const manualTickets = [];

  for (let tokenId = 1n; tokenId <= totalSupply; tokenId++) {
    try {
      const owner = await contract.ownerOf(tokenId);
      if (owner.toLowerCase() === USER_ADDRESS.toLowerCase()) {
        manualCount++;
        manualTickets.push(tokenId.toString());
        console.log(`  ✓ Token ID ${tokenId} owned by user`);
      }
    } catch (error) {
      // Token might not exist, skip
    }
  }

  console.log(`\n📈 Manual check found ${manualCount} tickets owned by user`);
  if (manualTickets.length > 0) {
    console.log(`   Ticket IDs: ${manualTickets.join(", ")}`);
  }

  // Compare results
  console.log(`\n📊 Comparison:`);
  console.log(`  - balanceOf: ${userBalance.toString()} tickets`);
  console.log(`  - getUserTickets: ${userTickets?.length || 0} tickets`);
  console.log(`  - Manual enumeration: ${manualCount} tickets`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
