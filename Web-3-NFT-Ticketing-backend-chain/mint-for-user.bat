@echo off
set RECIPIENT_ADDRESS=0x9bfaa6da0384390cbe0bd42b2eae2c19f6ea4a07
set POAP_COUNT=6
npx hardhat run scripts/mint-test-poaps.js --network sepolia
