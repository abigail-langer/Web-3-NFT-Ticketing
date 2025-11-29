'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain, useReadContract, usePublicClient } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { formatEther } from 'viem';

// 活动数据类型
interface Occasion {
  id: bigint;
  name: string;
  cost: bigint;
  tickets: bigint;
  maxTickets: bigint;
  date: string;
  time: string;
  location: string;
  organizer: string;
  resellable: boolean;
}

const NetworkSwitcher = () => {
    const { chain } = useAccount();
    const { switchChain } = useSwitchChain();

    if (chain && chain.id !== sepolia.id) {
        return (
            <div className="fixed top-0 left-0 w-full bg-yellow-500 text-black p-2 text-center z-50 flex justify-center items-center space-x-4">
                <span>⚠️ Wrong Network! Please switch to Sepolia Testnet.</span>
                <button
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    className="bg-black text-white font-bold py-1 px-3 rounded-lg hover:bg-gray-800"
                >
                    Switch to Sepolia
                </button>
            </div>
        );
    }
    return null;
};

export default function Home() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();

  // 读取总活动数
  const { data: totalOccasions } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'totalOccasions',
  });

  // 加载所有活动
  useEffect(() => {
    const loadOccasions = async () => {
      if (!totalOccasions || !publicClient) return;
      
      setLoading(true);
      try {
        const occasionPromises = [];
        for (let i = 1; i <= Number(totalOccasions); i++) {
          occasionPromises.push(
            publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'getOccasion',
              args: [BigInt(i)],
            })
          );
        }
        
        const results = await Promise.all(occasionPromises);
        setOccasions(results as Occasion[]);
      } catch (error) {
        console.error('Failed to load occasions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOccasions();
  }, [totalOccasions, publicClient]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <NetworkSwitcher />
      <div className="container mx-auto px-4 py-8 pt-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            🎫 NFT Ticket Marketplace
          </h1>
          <div className="flex items-center space-x-4">
            <ConnectButton />
            
            {isConnected && (
              <Link 
                href="/my-tickets" 
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                My Tickets
              </Link>
            )}
            {isConnected && (
              <Link 
                href="/my-poaps" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                🎖️ My POAPs
              </Link>
            )}
            {isConnected && (
              <Link 
                href="/checkin" 
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                🎫 Check-In System
              </Link>
            )}
            {isConnected && (
              <Link 
                href="/create-event" 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
              >
                Create Event
              </Link>
            )}
          </div>
        </header>

        {/* Events List */}
        <div>
          <h2 className="text-3xl font-bold mb-8 text-center">🎉 Upcoming Events</h2>
          
          {loading && (
            <div className="text-center text-xl text-gray-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
              <p>Loading events from blockchain...</p>
            </div>
          )}
          
          {!loading && occasions.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <p className="text-xl">No events available yet.</p>
              <p className="mt-2">Be the first to create an event!</p>
            </div>
          )}
          
          {!loading && occasions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {occasions.map((occasion) => (
                <div 
                  key={occasion.id.toString()} 
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-transform hover:scale-105 hover:border-purple-400"
                >
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-blue-300">{occasion.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">📍 {occasion.location}</p>
                  </div>
                  
                  <div className="text-sm space-y-2 mb-4">
                    <p><span className="font-semibold">📅 Date:</span> {occasion.date}</p>
                    <p><span className="font-semibold">🕐 Time:</span> {occasion.time}</p>
                    <p><span className="font-semibold">🎟️ Available:</span> {occasion.tickets.toString()} / {occasion.maxTickets.toString()}</p>
                    <p><span className="font-semibold">💰 Price:</span> {occasion.cost > 0 ? `${formatEther(occasion.cost)} ETH` : 'FREE (Gas only)'}</p>
                    {occasion.resellable && (
                      <span className="inline-block bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">
                        ♻️ Resellable
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link 
                      href={`/events/${occasion.id}`} 
                      className="flex-1 text-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-bold py-2 rounded-lg transition-all"
                    >
                      Buy Ticket
                    </Link>
                    {occasion.resellable && (
                      <Link 
                        href={`/market?eventId=${occasion.id}`} 
                        className="flex-1 text-center bg-gray-600 hover:bg-gray-700 font-bold py-2 rounded-lg transition-all"
                      >
                        Marketplace
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contract Info */}
        {chain?.id === sepolia.id && (
          <div className="mt-12 text-center text-sm text-gray-400">
            <p>Contract: <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{CONTRACT_ADDRESS}</a></p>
            <p className="mt-1">Network: Sepolia Testnet (Chain ID: {sepolia.id})</p>
          </div>
        )}
      </div>
    </main>
  );
}
