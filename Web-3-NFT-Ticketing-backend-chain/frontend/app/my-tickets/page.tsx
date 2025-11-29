'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESS, CONTRACT_ABI, POAP_CONTRACT_ADDRESS, POAP_ABI } from '../../config/contract';
import { formatEther, parseEther } from 'viem';
import Link from 'next/link';
import QRCode from 'qrcode';

interface TicketInfo {
  tokenId: bigint;
  occasionId: bigint;
  seat: bigint;
  occasionName: string;
  occasionDate: string;
  occasionLocation: string;
  isListed: boolean;
  listingPrice: bigint;
  resellable: boolean;
  eventEndTime: bigint;
  poapEnabled: boolean;
  hasClaimed: boolean;
  isCheckedIn: boolean;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingTokenId, setListingTokenId] = useState<bigint | null>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showingQRTokenId, setShowingQRTokenId] = useState<bigint | null>(null);
  
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const publicClient = usePublicClient();

  // 挂单
  const { writeContract: listTicket, data: listHash, isPending: isListing } = useWriteContract();
  const { isSuccess: listSuccess } = useWaitForTransactionReceipt({ hash: listHash });

  // 取消挂单
  const { writeContract: delistTicket, data: delistHash, isPending: isDelisting } = useWriteContract();
  const { isSuccess: delistSuccess } = useWaitForTransactionReceipt({ hash: delistHash });

  // 领取 POAP
  const { writeContract: claimPOAP, data: claimHash, isPending: isClaiming } = useWriteContract();
  const { isSuccess: claimSuccess } = useWaitForTransactionReceipt({ hash: claimHash });

  // 用户的 POAP 余额
  const { data: poapBalance } = useReadContract({
    address: POAP_CONTRACT_ADDRESS,
    abi: POAP_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    loadMyTickets();
  }, [isConnected, address, publicClient, listSuccess, delistSuccess, claimSuccess]);

  // 挂单成功后记录区块号
  useEffect(() => {
    const recordListBlock = async () => {
      if (listSuccess && listHash && address && publicClient) {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash: listHash });
          await fetch('http://localhost:3001/api/blocks/start-block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: address,
              blockNumber: receipt.blockNumber.toString(),
            }),
          });
          console.log(`✅ Recorded list block ${receipt.blockNumber} for ${address}`);
        } catch (error) {
          console.error('Failed to record list block:', error);
        }
      }
    };
    recordListBlock();
  }, [listSuccess, listHash, address, publicClient]);

  const loadMyTickets = async () => {
    if (!address || !publicClient) return;
    
    setLoading(true);
    try {
      // 🚀 优先从数据库缓存加载
      console.log('📦 Loading tickets from database cache...');
      const cacheResponse = await fetch(`http://localhost:3001/api/tickets/user/${address}`);
      const cacheData = await cacheResponse.json();
      
      if (cacheData.tickets && cacheData.tickets.length > 0) {
        console.log(`✅ Found ${cacheData.tickets.length} tickets in cache`);
        
        // 从缓存数据构建票据列表，只需要查询活动信息和挂单状态
        const ticketPromises = cacheData.tickets.map(async (cachedTicket: any) => {
          try {
            const tokenId = BigInt(cachedTicket.token_id);
            const occasionId = BigInt(cachedTicket.occasion_id);
            
            // 验证当前拥有者（防止票已转让）
            const currentOwner = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'ownerOf',
              args: [tokenId],
            }) as string;

            if (currentOwner.toLowerCase() !== address.toLowerCase()) {
              console.log(`⚠️ Token ${tokenId} has been transferred`);
              return null;
            }

            // 获取活动信息
            const occasion = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'getOccasion',
              args: [occasionId],
            }) as any;

            // 获取挂单信息
            const listing = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'getListing',
              args: [tokenId],
            }) as any;

            return {
              tokenId,
              occasionId,
              seat: BigInt(cachedTicket.seat_number),
              occasionName: occasion.name,
              occasionDate: occasion.date,
              occasionLocation: occasion.location,
              isListed: listing.isActive,
              listingPrice: listing.price,
              resellable: occasion.resellable,
              eventEndTime: occasion.eventEndTime || BigInt(0),
              poapEnabled: occasion.poapEnabled || false,
              hasClaimed: cachedTicket.has_claimed_poap || false,
              isCheckedIn: cachedTicket.is_checked_in || false,
            };
        } catch (error) {
          console.error('Error loading ticket:', error);
          return null;
        }
      });

        const results = await Promise.all(ticketPromises);
        const myTickets = results.filter((t): t is TicketInfo => t !== null);
        setTickets(myTickets);
      } else {
        // 数据库没有缓存，显示空列表
        console.log('⚠️ No tickets found in cache');
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to load tickets from cache:', error);
      // 缓存加载失败，显示空列表（不再回退到区块链查询）
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleListTicket = (tokenId: bigint) => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      listTicket({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'listTicket',
        args: [tokenId, parseEther(listingPrice)],
      });
      setListingTokenId(null);
      setListingPrice('');
    } catch (error) {
      console.error('List failed:', error);
      alert('Failed to list ticket');
    }
  };

  const handleDelistTicket = (tokenId: bigint) => {
    try {
      delistTicket({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'delistTicket',
        args: [tokenId],
      });
    } catch (error) {
      console.error('Delist failed:', error);
      alert('Failed to delist ticket');
    }
  };

  const handleClaimPOAP = (occasionId: bigint) => {
    try {
      claimPOAP({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimPOAP',
        args: [occasionId],
      });
    } catch (error) {
      console.error('Claim POAP failed:', error);
      alert('Failed to claim POAP');
    }
  };

  const generateQRCode = async (tokenId: bigint, occasionId: bigint, seat: bigint) => {
    try {
      const qrData = JSON.stringify({
        tokenId: tokenId.toString(),
        occasionId: occasionId.toString(),
        seat: seat.toString(),
        contract: CONTRACT_ADDRESS,
        type: 'ticket-checkin',
        network: 'sepolia'
      });
      
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(url);
      setShowingQRTokenId(tokenId);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Failed to generate QR code');
    }
  };

  const closeQRCode = () => {
    setQrCodeUrl(null);
    setShowingQRTokenId(null);
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

        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          🎫 My Tickets
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-xl">Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl mb-4">You don't have any tickets yet</p>
            <Link href="/" className="text-blue-400 hover:underline text-lg">Browse events →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket.tokenId.toString()} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-blue-300">{ticket.occasionName}</h3>
                  <p className="text-sm text-gray-400">📍 {ticket.occasionLocation}</p>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p><span className="font-semibold">🎟️ Token ID:</span> #{ticket.tokenId.toString()}</p>
                  <p><span className="font-semibold">💺 Seat:</span> #{ticket.seat.toString()}</p>
                  <p><span className="font-semibold">📅 Date:</span> {ticket.occasionDate}</p>
                  
                  {/* Check-in Status */}
                  <div className={`p-2 rounded-lg border ${ticket.isCheckedIn ? 'bg-green-500/20 border-green-500/50' : 'bg-yellow-500/20 border-yellow-500/50'}`}>
                    <p className="font-semibold flex items-center gap-2">
                      {ticket.isCheckedIn ? (
                        <>
                          <span className="text-green-300">✅ Checked In</span>
                        </>
                      ) : (
                        <>
                          <span className="text-yellow-300">⏳ Not Checked In</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* QR Code Button */}
                  <button
                    onClick={() => generateQRCode(ticket.tokenId, ticket.occasionId, ticket.seat)}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                  >
                    📱 Show QR Code
                  </button>
                  
                  {ticket.isListed && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-2 mt-2">
                      <p className="font-semibold text-yellow-300">📢 Listed for Sale</p>
                      <p className="text-sm">Price: {formatEther(ticket.listingPrice)} ETH</p>
                    </div>
                  )}
                </div>

                {ticket.resellable && (
                  <div className="space-y-2">
                    {!ticket.isListed ? (
                      listingTokenId === ticket.tokenId ? (
                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.001"
                            placeholder="Price in ETH"
                            value={listingPrice}
                            onChange={(e) => setListingPrice(e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleListTicket(ticket.tokenId)}
                              disabled={isListing}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-2 rounded font-bold"
                            >
                              {isListing ? 'Listing...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => {
                                setListingTokenId(null);
                                setListingPrice('');
                              }}
                              className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setListingTokenId(ticket.tokenId)}
                          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold"
                        >
                          💰 List for Sale
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleDelistTicket(ticket.tokenId)}
                        disabled={isDelisting}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-2 rounded font-bold"
                      >
                        {isDelisting ? 'Removing...' : '❌ Remove Listing'}
                      </button>
                    )}
                  </div>
                )}

                {!ticket.resellable && (
                  <p className="text-sm text-gray-400 text-center py-2">🔒 This ticket cannot be resold</p>
                )}

                {/* POAP 领取功能 */}
                {ticket.poapEnabled && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-purple-300">🎖️ POAP Reward</span>
                        {ticket.hasClaimed && (
                          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Claimed</span>
                        )}
                      </div>
                      
                      {(() => {
                        // Must check in before claiming POAP
                        if (!ticket.isCheckedIn) {
                          return (
                            <p className="text-xs text-gray-400">
                              ⏳ Please check in first to claim POAP
                            </p>
                          );
                        }
                        
                        if (ticket.hasClaimed) {
                          return (
                            <p className="text-xs text-green-400">
                              ✅ You've claimed your POAP!
                            </p>
                          );
                        }
                        
                        return (
                          <button
                            onClick={() => handleClaimPOAP(ticket.occasionId)}
                            disabled={isClaiming}
                            className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 py-2 rounded-lg font-bold text-sm transition-all"
                          >
                            {isClaiming ? 'Claiming...' : '🎁 Claim POAP'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrCodeUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeQRCode}>
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Ticket QR Code</h3>
              <button
                onClick={closeQRCode}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg border-4 border-gray-200 mb-4">
              <img src={qrCodeUrl} alt="Ticket QR Code" className="w-full" />
            </div>
            
            <div className="text-center text-gray-600 text-sm mb-4">
              <p className="font-bold mb-2">Show this QR code at the event venue</p>
              <p>Organizer will scan to complete check-in</p>
            </div>
            
            <button
              onClick={closeQRCode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
