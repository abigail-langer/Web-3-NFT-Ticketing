import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";

// 你的 Web3Auth Client ID
const clientId =
  "BHFho2zc7EDGUSWjV1Fx6NM-B_jURQcybr5m2qFtmf7X7yOqaCnmxMIx1kx7TK-q8XwHfAE4ZnN0HgLuEM2tN70";

let web3auth: Web3Auth | null = null;

export const initWeb3Auth = async () => {
  if (web3auth) return web3auth;

  web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // 匹配 Dashboard 中的项目网络
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0xaa36a7", // 11155111 (Sepolia)
      rpcTarget: "https://rpc.sepolia.org",
      displayName: "Sepolia Testnet",
      ticker: "ETH",
      tickerName: "Ethereum",
      blockExplorerUrl: "https://sepolia.etherscan.io",
    },
  });

  await web3auth.init(); // v10+ 使用 init() 而不是 initModal()
  return web3auth;
};
