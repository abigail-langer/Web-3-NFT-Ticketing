'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { POAP_CONTRACT_ADDRESS, POAP_ABI } from '../../config/contract';
import Link from 'next/link';

interface POAPInfo {
  tokenId: bigint;
  tokenURI: string;
  eventName?: string;
}

export default function MyPOAPsPage() {
  const [poaps, setPoaps] = useState<POAPInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    loadMyPOAPs();
  }, [isConnected, address, publicClient]);

  const loadMyPOAPs = async () => {
    if (!address || !publicClient) return;
    
    setLoading(true);
    try {
      // 获取用户的 POAP 数量
      const balance = await publicClient.readContract({
        address: POAP_CONTRACT_ADDRESS,
        abi: POAP_ABI,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint;

      if (balance === BigInt(0)) {
        setPoaps([]);
        setLoading(false);
        return;
      }

      // 获取每个 POAP 的详细信息
      const poapPromises = [];
      for (let i = 0; i < Number(balance); i++) {
        poapPromises.push(
          publicClient.readContract({
            address: POAP_CONTRACT_ADDRESS,
            abi: POAP_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [address, BigInt(i)],
          }).then(async (tokenId) => {
            const tokenURI = await publicClient.readContract({
              address: POAP_CONTRACT_ADDRESS,
              abi: POAP_ABI,
              functionName: 'tokenURI',
              args: [tokenId as bigint],
            }) as string;

            return {
              tokenId: tokenId as bigint,
              tokenURI,
            };
          })
        );
      }

      const results = await Promise.all(poapPromises);
      setPoaps(results);
    } catch (error) {
      console.error('Failed to load POAPs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">← Back to Events</Link>
          <ConnectButton />
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          🎖️ My POAPs
        </h1>

        <div className="mb-6 p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
          <p className="text-sm text-gray-300">
            <span className="font-bold text-purple-300">What are POAPs?</span> Proof of Attendance Protocol tokens are non-transferable NFTs that prove you attended an event. 
            They grant you priority access to future events!
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-xl">Loading your POAPs...</p>
          </div>
        ) : poaps.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎖️</div>
            <p className="text-2xl mb-4">You don't have any POAPs yet</p>
            <p className="text-gray-400 mb-6">Attend events to collect POAPs and unlock priority benefits!</p>
            <Link href="/" className="text-blue-400 hover:underline text-lg">Browse events →</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-lg">
                <span className="font-bold text-purple-300">Total POAPs:</span> {poaps.length}
              </p>
              <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg">
                ✅ Priority Access Enabled
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {poaps.map((poap) => (
                <div 
                  key={poap.tokenId.toString()} 
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border-2 border-purple-500/50 hover:border-purple-400 transition-all hover:scale-105"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-purple-300">POAP #{poap.tokenId.toString()}</h3>
                    <span className="text-3xl">🎖️</span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Token URI:</p>
                      <p className="font-mono text-xs break-all text-purple-300">
                        {poap.tokenURI.slice(0, 40)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-bold">Non-Transferable</span>
                    </div>

                    <div className="pt-3 border-t border-purple-500/30">
                      <p className="text-xs text-gray-400">Benefits:</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li className="flex items-center gap-2">
                          <span className="text-yellow-400">⭐</span>
                          <span>Priority seat selection</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-blue-400">⚡</span>
                          <span>Early ticket access</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
