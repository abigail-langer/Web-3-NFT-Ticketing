"use client";

import { useState } from "react";
import { initWeb3Auth } from "@/lib/web3auth";
import { ethers } from "ethers";

export default function Web3AuthLoginButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const web3auth = await initWeb3Auth();
      const provider = await web3auth.connect(); // 弹出 Web3Auth 登录（邮箱/社交等）

      if (!provider) return;

      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const signer = await ethersProvider.getSigner();
      const addr = await signer.getAddress();

      setAddress(addr);
      console.log("[Web3Auth] Logged in address:", addr);
    } catch (error) {
      console.error("Web3Auth login failed:", error);
      alert("Web3Auth 登录失败，请查看控制台日志");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const web3auth = await initWeb3Auth();
    await web3auth.logout();
    setAddress(null);
  };

  return (
    <div className="flex items-center">
      {address ? (
        <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 pl-3 gap-3 transition-all hover:bg-white/15">
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-300 font-medium uppercase tracking-wider">
              Web3Auth
            </span>
            <span className="text-sm font-bold font-mono text-white">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg text-xs font-bold transition-colors border border-red-500/30"
          >
            Exit
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`
            relative group px-5 py-2.5 rounded-xl font-bold text-white shadow-lg
            bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500
            border border-white/20 transition-all duration-200 hover:scale-105 hover:shadow-purple-500/25
            flex items-center gap-2
            ${loading ? "opacity-70 cursor-wait" : ""}
          `}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span className="text-lg">📧</span>
              <span>Email Login</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
