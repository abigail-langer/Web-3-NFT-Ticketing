'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../config/contract';
import { parseEther } from 'viem';
import Link from 'next/link';

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    name: '',
    cost: '0',
    maxTickets: '',
    date: '',
    time: '',
    location: '',
    resellable: true,
  });

  const { isConnected } = useAccount();
  const router = useRouter();
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.maxTickets || !formData.date || !formData.time || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const costInWei = formData.cost === '0' ? 0n : parseEther(formData.cost);
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'list',
        args: [
          formData.name,
          costInWei,
          BigInt(formData.maxTickets),
          formData.date,
          formData.time,
          formData.location,
          formData.resellable,
        ],
      });
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Check console for details.');
    }
  };

  if (isSuccess) {
    setTimeout(() => router.push('/'), 2000);
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Please Connect Your Wallet</h1>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-400 hover:underline">← Back to Events</Link>
          <ConnectButton />
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          🎪 Create New Event
        </h1>

        {isSuccess ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">✅ Event Created Successfully!</h2>
            <p>Redirecting to home page...</p>
            <p className="text-sm text-gray-400 mt-4">
              Transaction: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{hash?.slice(0, 10)}...{hash?.slice(-8)}</a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Event Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="e.g., ETH Global Hackathon"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Ticket Price (ETH) *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="0 for free (gas only)"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Set to 0 for free tickets (buyers only pay gas)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Maximum Tickets *</label>
              <input
                type="number"
                min="1"
                value={formData.maxTickets}
                onChange={(e) => setFormData({ ...formData, maxTickets: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="e.g., 100"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Date *</label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="e.g., Dec 25, 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Time *</label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="e.g., 7:00 PM EST"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="e.g., New York Convention Center"
                required
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="resellable"
                checked={formData.resellable}
                onChange={(e) => setFormData({ ...formData, resellable: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="resellable" className="text-sm">
                ♻️ Allow ticket resale on secondary market
                <span className="block text-xs text-gray-400 mt-1">
                  You'll receive 5% royalty on all secondary sales
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 font-bold py-4 rounded-lg text-xl transition-all disabled:cursor-not-allowed"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Creating Event...' : '🎪 Create Event'}
            </button>

            {hash && !isSuccess && (
              <p className="text-center text-sm text-gray-400">
                Transaction: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{hash.slice(0, 10)}...{hash.slice(-8)}</a>
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
