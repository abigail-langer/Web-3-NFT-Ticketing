'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../config/contract';
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

export default function MyEventsPage() {
  const [myEvents, setMyEvents] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // 读取总活动数
  const { data: totalOccasions } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'totalOccasions',
  });

  // 加载并筛选我举办的活动
  useEffect(() => {
    const loadMyEvents = async () => {
      if (!totalOccasions || !publicClient || !address) {
        setLoading(false);
        return;
      }
      
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
        // 筛选出我是组织者的活动
        const myHostedEvents = (results as Occasion[]).filter(
          (occasion) => occasion.organizer.toLowerCase() === address.toLowerCase()
        );
        
        setMyEvents(myHostedEvents);
      } catch (error) {
        console.error('Failed to load my events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      loadMyEvents();
    } else {
      setLoading(false);
    }
  }, [totalOccasions, publicClient, address, isConnected]);

  if (!isConnected) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">← Back to Events</Link>
          <ConnectButton />
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          👑 My Hosted Events
        </h1>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-xl">Loading your events...</p>
          </div>
        ) : myEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.map((occasion) => (
              <div 
                key={`my-${occasion.id.toString()}`} 
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
              >
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-blue-300">{occasion.name}</h3>
                  <p className="text-sm text-gray-400">📍 {occasion.location}</p>
                </div>
                
                <div className="space-y-2 mb-4 text-sm">
                  <p><span className="font-semibold">📅 Date:</span> {occasion.date}</p>
                  <p><span className="font-semibold">🕐 Time:</span> {occasion.time}</p>
                  <p><span className="font-semibold">🎟️ Sold:</span> {Number(occasion.maxTickets) - Number(occasion.tickets)} / {occasion.maxTickets.toString()}</p>
                  <p><span className="font-semibold">💰 Revenue:</span> {formatEther(occasion.cost * (occasion.maxTickets - occasion.tickets))} ETH</p>
                  {occasion.resellable && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded p-2 mt-2 inline-block">
                      <p className="text-green-300 text-xs font-semibold">♻️ Resellable Event</p>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    href={`/events/${occasion.id}`} 
                    className="w-full text-center bg-blue-600 hover:bg-blue-700 font-bold py-2 rounded-lg transition-all"
                  >
                    Manage Event
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-2xl mb-4">You haven't hosted any events yet</p>
            <Link 
              href="/create-event" 
              className="text-blue-400 hover:underline text-lg"
            >
              Create Your First Event →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
