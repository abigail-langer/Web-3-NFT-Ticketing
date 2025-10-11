'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';

// NFT Ticket Contract ABI (backend needs to provide complete ABI)
const TICKET_CONTRACT_ABI = [
  {
    "inputs": [
      { "name": "eventId", "type": "uint256" },
      { "name": "quantity", "type": "uint256" }
    ],
    "name": "purchaseTicket",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "eventId", "type": "uint256" }],
    "name": "getEventInfo",
    "outputs": [
      { "name": "name", "type": "string" },
      { "name": "price", "type": "uint256" },
      { "name": "totalSupply", "type": "uint256" },
      { "name": "remaining", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "getOwnedTickets",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address - backend needs to provide after deployment
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [selectedEventId, setSelectedEventId] = useState(1);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  // Read event information
  const { data: eventInfo, refetch: refetchEventInfo } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TICKET_CONTRACT_ABI,
    functionName: 'getEventInfo',
    args: [BigInt(selectedEventId)],
  });

  // Read user owned tickets
  const { data: ownedTickets, refetch: refetchOwnedTickets } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TICKET_CONTRACT_ABI,
    functionName: 'getOwnedTickets',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Write contract function for purchasing tickets
  const { data: hash, writeContract, isPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Refetch data after successful purchase
  useEffect(() => {
    if (isSuccess) {
      refetchEventInfo();
      refetchOwnedTickets();
    }
  }, [isSuccess, refetchEventInfo, refetchOwnedTickets]);

  const handlePurchaseTicket = async () => {
    if (!eventInfo) return;

    const price = eventInfo[1]; // price from eventInfo
    const totalPrice = price * BigInt(purchaseQuantity);

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: TICKET_CONTRACT_ABI,
      functionName: 'purchaseTicket',
      args: [BigInt(selectedEventId), BigInt(purchaseQuantity)],
      value: totalPrice,
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            NFT Ticket System
          </h1>
          <ConnectButton />
        </header>

        {/* Main Content */}
        {!isConnected ? (
          <div className="text-center py-20">
            <h2 className="text-3xl mb-4">Welcome to NFT Ticket System</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to get started on Base Sepolia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Purchase Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold mb-6">Purchase Tickets</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event ID</label>
                  <input
                    type="number"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                {eventInfo && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="font-bold mb-2">Event: {eventInfo[0]}</h3>
                    <p className="text-sm">Price: {eventInfo[1].toString()} wei</p>
                    <p className="text-sm">Available: {eventInfo[3].toString()} / {eventInfo[2].toString()}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <button
                  onClick={handlePurchaseTicket}
                  disabled={isPending || isConfirming}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 font-bold py-3 rounded-lg transition-all"
                >
                  {isPending || isConfirming ? 'Processing...' : 'Purchase Ticket'}
                </button>

                {isSuccess && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-center">
                    Purchase successful!
                  </div>
                )}
              </div>
            </div>

            {/* My Tickets Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold mb-6">My Tickets</h2>

              {ownedTickets && ownedTickets.length > 0 ? (
                <div className="space-y-3">
                  {ownedTickets.map((ticketId) => (
                    <div
                      key={ticketId.toString()}
                      className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-400">Ticket ID</p>
                          <p className="text-xl font-bold">#{ticketId.toString()}</p>
                        </div>
                        <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                          Active
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-400">NFT Token on Base Sepolia</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No tickets owned yet</p>
              )}
            </div>
          </div>
        )}

        {/* Backend Requirements Notice */}
        <div className="mt-12 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3">Backend Integration Required</h3>
          <p className="text-sm text-gray-300">
            This frontend is ready but requires backend smart contract deployment.
            See BACKEND_REQUIREMENTS.md for details.
          </p>
        </div>
      </div>
    </main>
  );
}
