'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI, POAP_CONTRACT_ADDRESS, POAP_ABI } from '../../../config/contract';
import { formatEther, parseEther } from 'viem';
import Link from 'next/link';

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
  eventEndTime?: bigint;
  earlySaleStart?: bigint;
  publicSaleStart?: bigint;
  poapEnabled?: boolean;
}

type SalePhase = 'not_started' | 'early_bird' | 'public' | 'ended';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [seatsTaken, setSeatsTaken] = useState<bigint[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [prioritySeats, setPrioritySeats] = useState<bigint[]>([]);
  const [userPoapBalance, setUserPoapBalance] = useState<bigint>(BigInt(0));
  const [currentTime, setCurrentTime] = useState<bigint>(BigInt(Math.floor(Date.now() / 1000)));

  // 读取活动信息
  const { data: occasionData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getOccasion',
    args: [BigInt(eventId)],
  });

  // 读取已占用座位
  const { data: takenSeats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getSeatsTaken',
    args: [BigInt(eventId)],
  });

  // 购买门票
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(BigInt(Math.floor(Date.now() / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (occasionData) {
      setOccasion(occasionData as Occasion);
      setLoading(false);
    }
  }, [occasionData]);

  useEffect(() => {
    if (takenSeats) {
      setSeatsTaken(takenSeats as bigint[]);
    }
  }, [takenSeats]);

  // 加载优先座位
  useEffect(() => {
    const loadPrioritySeats = async () => {
      if (!publicClient) return;
      try {
        const seats = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getPrioritySeats',
          args: [BigInt(eventId)],
        }) as bigint[];
        setPrioritySeats(seats || []);
      } catch (error) {
        console.error('Failed to load priority seats:', error);
      }
    };
    loadPrioritySeats();
  }, [eventId, publicClient]);

  // 加载用户 POAP 余额
  useEffect(() => {
    const loadUserPoapBalance = async () => {
      if (!address || !publicClient) return;
      try {
        const balance = await publicClient.readContract({
          address: POAP_CONTRACT_ADDRESS,
          abi: POAP_ABI,
          functionName: 'balanceOf',
          args: [address],
        }) as bigint;
        setUserPoapBalance(balance || BigInt(0));
      } catch (error) {
        console.error('Failed to load POAP balance:', error);
      }
    };
    loadUserPoapBalance();
  }, [address, publicClient]);

  useEffect(() => {
    const recordTicketPurchase = async () => {
      if (isSuccess && hash && address && publicClient && selectedSeat) {
        try {
          // 获取交易收据
          const receipt = await publicClient.getTransactionReceipt({ hash });
          const blockNumber = receipt.blockNumber;

          // 从交易日志中获取 tokenId
          const transferLog = receipt.logs.find((log: any) =>
            log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event signature
          );

          if (transferLog && transferLog.topics[3]) {
            const tokenId = BigInt(transferLog.topics[3]);

            // 尝试记录完整票据信息到数据库（可选，失败不影响购票）
            try {
              await fetch('http://localhost:3001/api/tickets/mint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tokenId: tokenId.toString(),
                  occasionId: Number(eventId),
                  seatNumber: selectedSeat,
                  ownerAddress: address,
                  txHash: hash,
                  blockNumber: Number(blockNumber),
                }),
              });

              console.log(`✅ Ticket recorded: Token #${tokenId}, Seat ${selectedSeat}, Block ${blockNumber}`);
            } catch (dbError) {
              console.warn('📝 Database recording skipped (backend unavailable):', dbError);
            }
          }

          // 尝试记录起始区块号（用于事件查询优化，可选）
          try {
            await fetch('http://localhost:3001/api/blocks/start-block', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                walletAddress: address,
                blockNumber: blockNumber.toString(),
              }),
            });
          } catch (dbError) {
            console.warn('📝 Block number recording skipped (backend unavailable):', dbError);
          }

        } catch (error) {
          console.error('Failed to record ticket purchase:', error);
        }

        alert('🎉 Ticket purchased successfully!');
        router.push('/my-tickets');
      }
    };

    recordTicketPurchase();
  }, [isSuccess, hash, address, publicClient, router, selectedSeat, eventId]);

  const handleBuyTicket = async () => {
    if (!selectedSeat || !occasion) {
      alert('Please select a seat first!');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'mint',
        args: [BigInt(eventId), BigInt(selectedSeat)],
        value: occasion.cost,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Check console for details.');
    }
  };

  const isSeatTaken = (seatNum: number) => {
    return seatsTaken.some(seat => Number(seat) === seatNum);
  };

  // 获取当前销售阶段
  const getSalePhase = (): SalePhase => {
    if (!occasion) return 'not_started';

    const now = currentTime;
    const earlyStart = occasion.earlySaleStart || BigInt(0);
    const publicStart = occasion.publicSaleStart || BigInt(0);
    const eventEnd = occasion.eventEndTime || BigInt(0);

    if (eventEnd > 0 && now > eventEnd) {
      return 'ended';
    }

    if (earlyStart > 0 && now >= earlyStart && now < publicStart) {
      return 'early_bird';
    }

    if (now >= publicStart) {
      return 'public';
    }

    return 'not_started';
  };

  // 检查用户是否可以购买某个座位
  const canPurchaseSeat = (seatNum: number): { canPurchase: boolean; reason?: string } => {
    const salePhase = getSalePhase();
    const isPriority = prioritySeats.some(s => Number(s) === seatNum);
    const hasPOAP = userPoapBalance >= BigInt(5);

    // 未开始销售 - 所有座位锁定
    if (salePhase === 'not_started') {
      return { canPurchase: false, reason: 'Sale has not started yet' };
    }

    // 早鸟期 - 只有POAP持有者(5+)可以购买任何座位
    if (salePhase === 'early_bird') {
      if (!hasPOAP) {
        return { canPurchase: false, reason: 'Early bird sale requires 5+ POAPs for all seats' };
      }
      // 早鸟期的POAP持有者可以购买任何座位(包括优先座位)
      return { canPurchase: true };
    }

    // 公开销售期 - 优先座位仍需要POAP
    if (salePhase === 'public') {
      if (isPriority && !hasPOAP) {
        return { canPurchase: false, reason: 'Priority seat requires 5+ POAPs' };
      }
      return { canPurchase: true };
    }

    return { canPurchase: true };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-xl">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!occasion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">Event not found</p>
          <Link href="/" className="text-blue-400 hover:underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  const totalSeats = Number(occasion.maxTickets);
  const availableSeats = Number(occasion.tickets);
  const salePhase = getSalePhase();
  const hasPOAP = userPoapBalance >= BigInt(5);

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">← Back to Events</Link>
          <ConnectButton />
        </div>

        {/* Event Info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            {occasion.name}
          </h1>
          <div className="grid md:grid-cols-2 gap-6 text-lg">
            <div className="space-y-3">
              <p><span className="font-semibold">📍 Location:</span> {occasion.location}</p>
              <p><span className="font-semibold">📅 Date:</span> {occasion.date}</p>
              <p><span className="font-semibold">🕐 Time:</span> {occasion.time}</p>
            </div>
            <div className="space-y-3">
              <p><span className="font-semibold">💰 Price:</span> {occasion.cost > 0 ? `${formatEther(occasion.cost)} ETH` : 'FREE (Gas only)'}</p>
              <p><span className="font-semibold">🎟️ Available:</span> {availableSeats} / {totalSeats}</p>
              <p><span className="font-semibold">👤 Organizer:</span> {occasion.organizer.slice(0, 6)}...{occasion.organizer.slice(-4)}</p>
              {occasion.resellable && (
                <span className="inline-block bg-green-500/20 text-green-300 px-3 py-1 rounded">
                  ♻️ Resellable on Secondary Market
                </span>
              )}
            </div>
          </div>

          {/* 销售阶段状态显示 */}
          {occasion.poapEnabled && (
            <div className="mt-6 space-y-3">
              {/* 用户POAP状态 */}
              <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-purple-300 mb-1">🎖️ Your POAP Status</p>
                    <p className="text-sm text-gray-300">You have {userPoapBalance.toString()} POAP badge{userPoapBalance !== BigInt(1) ? 's' : ''}</p>
                  </div>
                  {hasPOAP ? (
                    <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg">
                      <p className="text-xs font-bold">QUALIFIED</p>
                      <p className="text-lg font-bold">✅ {userPoapBalance.toString()} POAPs</p>
                    </div>
                  ) : (
                    <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg">
                      <p className="text-xs font-bold">NOT QUALIFIED</p>
                      <p className="text-sm font-bold">Need 5+ POAPs</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 销售阶段倒计时 */}
              {salePhase === 'not_started' && occasion.earlySaleStart && occasion.earlySaleStart > BigInt(0) && (
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="font-bold text-yellow-300 mb-2">⏳ Sale Not Started</p>
                  <p className="text-sm text-gray-300 mb-2">
                    Early bird sale starts in: <span className="font-bold text-white">
                      {formatCountdown(Number(occasion.earlySaleStart - currentTime))}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {hasPOAP ? '✅ You qualify for early bird access!' : '❌ You need 5+ POAPs for early bird access'}
                  </p>
                </div>
              )}

              {salePhase === 'early_bird' && occasion.publicSaleStart && (
                <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="font-bold text-blue-300 mb-2">🎯 Early Bird Sale Active</p>
                  <p className="text-sm text-gray-300 mb-2">
                    Public sale starts in: <span className="font-bold text-white">
                      {formatCountdown(Number(occasion.publicSaleStart - currentTime))}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {hasPOAP ? '✅ You can purchase tickets now!' : '⏳ Only POAP holders (5+) can purchase during early bird period'}
                  </p>
                </div>
              )}

              {salePhase === 'public' && (
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="font-bold text-green-300 mb-1">🎉 Public Sale Active</p>
                  <p className="text-sm text-gray-300">Everyone can purchase tickets now!</p>
                  {prioritySeats.length > 0 && (
                    <p className="text-xs text-yellow-300 mt-2">
                      ⭐ Seats 1-10 are priority seats (require 5+ POAPs)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seat Selection */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold mb-6">Select Your Seat</h2>

          {!isConnected ? (
            <div className="text-center py-12">
              <p className="text-xl mb-4">Please connect your wallet to purchase tickets</p>
              <ConnectButton />
            </div>
          ) : availableSeats === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-red-400">😔 Sorry, this event is sold out!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-8">
                {Array.from({ length: totalSeats }, (_, i) => i + 1).map((seatNum) => {
                  const taken = isSeatTaken(seatNum);
                  const selected = selectedSeat === seatNum;
                  const isPriority = prioritySeats.some(s => Number(s) === seatNum);
                  const { canPurchase, reason } = canPurchaseSeat(seatNum);

                  return (
                    <button
                      key={seatNum}
                      onClick={() => !taken && canPurchase && setSelectedSeat(seatNum)}
                      disabled={taken || !canPurchase}
                      title={taken ? 'Seat taken' : !canPurchase ? reason : 'Click to select'}
                      className={`
                        aspect-square rounded-lg font-bold text-sm transition-all relative
                        ${taken ? 'bg-red-500/30 cursor-not-allowed' :
                          selected ? 'bg-green-500 scale-110' :
                          !canPurchase ? 'bg-gray-700/50 cursor-not-allowed' :
                          isPriority ? 'bg-purple-500/70 hover:bg-purple-500 hover:scale-105 ring-2 ring-yellow-400' :
                          'bg-blue-500/50 hover:bg-blue-500 hover:scale-105'}
                      `}
                    >
                      {seatNum}
                      {isPriority && (
                        <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                      )}
                      {!taken && !canPurchase && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg text-xs">
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500/50 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500/70 rounded ring-2 ring-yellow-400"></div>
                    <span>⭐ Priority (5+ POAPs)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-500/30 rounded"></div>
                    <span>Taken</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-700/50 rounded relative">
                      <span className="absolute inset-0 flex items-center justify-center text-xs">🔒</span>
                    </div>
                    <span>Locked</span>
                  </div>
                </div>
              </div>

              {selectedSeat && (
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
                  <p className="text-lg">Selected Seat: <span className="font-bold">#{selectedSeat}</span></p>
                  <p className="text-lg">Total: <span className="font-bold">{occasion.cost > 0 ? `${formatEther(occasion.cost)} ETH` : 'FREE'} + Gas</span></p>
                </div>
              )}

              <button
                onClick={handleBuyTicket}
                disabled={!selectedSeat || isPending || isConfirming}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 font-bold py-4 rounded-lg text-xl transition-all disabled:cursor-not-allowed"
              >
                {isPending ? 'Confirm in Wallet...' :
                 isConfirming ? 'Processing...' :
                 selectedSeat ? `Buy Ticket - Seat #${selectedSeat}` :
                 'Select a Seat First'}
              </button>

              {hash && (
                <p className="mt-4 text-center text-sm text-gray-400">
                  Transaction: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{hash.slice(0, 10)}...{hash.slice(-8)}</a>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
