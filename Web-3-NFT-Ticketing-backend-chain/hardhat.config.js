require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const {
  PRIVATE_KEY,
  SEPOLIA_RPC_URL,
  RPC_SEPOLIA,
  ETHERSCAN_API_KEY,
  RPC_BASE_SEPOLIA,
  BASESCAN_API_KEY
} = process.env;

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    sepolia: {
      chainId: 11155111,
      url: SEPOLIA_RPC_URL || RPC_SEPOLIA || "https://rpc.sepolia.org",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY.replace(/^0x/, '')}`] : []
    },
    baseSepolia: {
      chainId: 84532,
      url: RPC_BASE_SEPOLIA || "https://sepolia.base.org",
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY.replace(/^0x/, '')}`] : []
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY || "",
      baseSepolia: BASESCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};
