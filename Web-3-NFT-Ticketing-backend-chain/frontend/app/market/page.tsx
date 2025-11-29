'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../config/contract';
import { formatEther } from 'viem';
import Link from 'next/link';

interface MarketListing {
  tokenId: bigint;
  price: bigint;
  seller: string;
  occasionId: bigint;
  seat: bigint;
  occasionName: string;
  occasionDate: string;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const { writeContract: buyTicket, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    loadMarketListings();
  }, [publicClient, isSuccess]);

  const loadMarketListings = async () => {
    if (!publicClient) return;
    
    setLoading(true);
    try {
      // 获取当前区块号
      const currentBlock = await publicClient.getBlockNumber();
      
      // 从后端获取全局最早区块号（所有用户中最早的区块）
      let startBlock = 0n;
      try {
        const response = await fetch('http://localhost:3001/api/blocks/global-start-block');
        const data = await response.json();
        if (data.startBlock) {
          startBlock = BigInt(data.startBlock);
          console.log(`✅ 从数据库获取全局最早区块: ${startBlock}`);
        } else {
          // 如果没有记录，从最近1000个区块开始
          startBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;
          console.log(`⚠️ 没有历史记录，从最近1000个区块开始: ${startBlock}`);
        }
      } catch (error) {
        console.error('Failed to fetch global start block, using recent 1000 blocks:', error);
        startBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;
      }
      
      // 分批查询 TicketListed 事件（Alchemy 免费套餐限制每次查询 10 个区块）
      const BATCH_SIZE = 10n;
      const allLogs: any[] = [];
      
      console.log(`查询市场挂单区块范围: ${startBlock} - ${currentBlock}`);
      
      for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += BATCH_SIZE) {
        const toBlock = fromBlock + BATCH_SIZE - 1n > currentBlock 
          ? currentBlock 
          : fromBlock + BATCH_SIZE - 1n;
        
        try {
          const logs = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: {
              type: 'event',
              name: 'TicketListed',
              inputs: [
                { indexed: true, name: 'tokenId', type: 'uint256' },
                { indexed: false, name: 'price', type: 'uint256' },
                { indexed: false, name: 'seller', type: 'address' },
              ],
            },
            fromBlock,
            toBlock,
          });
          
          allLogs.push(...logs);
        } catch (error) {
          console.error(`Error fetching logs from ${fromBlock} to ${toBlock}:`, error);
        }
      }

      // 获取每个挂单的详细信息
      const listingPromises = allLogs.map(async (log) => {
        try {
          const tokenId = log.args.tokenId as bigint;

          // 检查挂单是否仍然有效
          const listing = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getListing',
            args: [tokenId],
          }) as any;

          const listingIsActive = listing?.isActive ?? listing?.[2];
          if (!listingIsActive) return null;
          const listingPrice = listing?.price ?? listing?.[0];
          const listingSeller = listing?.seller ?? listing?.[1];

          // 获取门票信息
          const ticketInfo = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getTicketInfo',
            args: [tokenId],
          }) as any;

          const tiOccasionId = ticketInfo?.occasionId ?? ticketInfo?.[0];
          const tiSeat = ticketInfo?.seat ?? ticketInfo?.[1];

          if (eventId && tiOccasionId?.toString() !== eventId) {
            return null;
          }

          // 获取活动信息
          const occasion = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getOccasion',
            args: [tiOccasionId],
          }) as any;

          const occName = occasion?.name ?? occasion?.[1];
          const occDate = occasion?.date ?? occasion?.[5];

          return {
            tokenId,
            price: listingPrice,
            seller: listingSeller,
            occasionId: tiOccasionId,
            seat: tiSeat,
            occasionName: occName,
            occasionDate: occDate,
          };
        } catch (error) {
          console.error('Error loading listing:', error);
          return null;
        }
      });

      const results = await Promise.all(listingPromises);
      const activeListings = results.filter((l): l is MarketListing => l !== null);
      setListings(activeListings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = (tokenId: bigint, price: bigint) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      buyTicket({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'buyTicket',
        args: [tokenId],
        value: price,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Check console for details.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">← Back to Events</Link>
          <ConnectButton />
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          🛒 Secondary Marketplace
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-xl">Loading marketplace...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl mb-4">No tickets for sale</p>
            <p className="text-gray-400">Check back later or browse events to buy from organizers</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={String(listing.tokenId)} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-blue-300">{listing.occasionName}</h3>
                  <p className="text-sm text-gray-400">📅 {listing.occasionDate}</p>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm"><span className="font-semibold">🎟️ Token ID:</span> #{String(listing.tokenId)}</p>
                  <p className="text-sm"><span className="font-semibold">💺 Seat:</span> #{String(listing.seat)}</p>
                  <p className="text-sm"><span className="font-semibold">👤 Seller:</span> {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</p>
                  
                  <div className="bg-green-500/20 border border-green-500/50 rounded p-3 mt-3">
                    <p className="text-lg font-bold text-green-300">💰 {formatEther(listing.price)} ETH</p>
                    <p className="text-xs text-gray-300 mt-1">+ Platform fee (2.5%) + Organizer royalty (5%)</p>
                  </div>
                </div>

                {address?.toLowerCase() === listing.seller.toLowerCase() ? (
                  <button
                    disabled
                    className="w-full bg-gray-600 py-3 rounded-lg font-bold cursor-not-allowed"
                  >
                    Your Listing
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuyTicket(listing.tokenId, listing.price)}
                    disabled={isPending || !isConnected}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 py-3 rounded-lg font-bold transition-all"
                  >
                    {isPending ? 'Processing...' : '🛒 Buy Now'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {hash && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Transaction: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{hash.slice(0, 10)}...{hash.slice(-8)}</a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
