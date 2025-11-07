'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

// Define types for our data for type safety
interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  price: string;
}

interface AuthState {
  token: string;
  user: {
    id: number;
    wallet_address: string;
  };
}

const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'nft-ticket-auth-token';

const NetworkSwitcher = () => {
    const { chain } = useAccount();
    const { chains, switchChain } = useSwitchChain();

    if (chain && chain.id !== baseSepolia.id) {
        return (
            <div className="fixed top-0 left-0 w-full bg-yellow-500 text-black p-2 text-center z-50 flex justify-center items-center space-x-4">
                <span>Wrong Network Detected! Please switch to Base Sepolia.</span>
                <button
                    onClick={() => switchChain({ chainId: baseSepolia.id })}
                    className="bg-black text-white font-bold py-1 px-3 rounded-lg"
                >
                    Switch Network
                </button>
            </div>
        );
    }

    return null;
};


export default function Home() {
  // App State
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Wagmi Hooks
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // --- Data Fetching ---
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setEvents(data);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
        else setError('An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // --- Authentication Logic ---
  const handleLogin = useCallback(async () => {
    if (!address || isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      // 1. Get nonce from backend
      const nonceRes = await fetch(`${API_BASE_URL}/auth/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });
      const { message } = await nonceRes.json();

      // 2. Sign the message from the backend
      const signature = await signMessageAsync({ message });

      // 3. Verify signature with backend and get JWT
      const verifyRes = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, signature }),
      });
      
      if (!verifyRes.ok) throw new Error('Verification failed');

      const authData: AuthState = await verifyRes.json();
      localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
      setAuthState(authData);
      console.log('Login successful, token:', authData.token);

    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed. Check the console for details.');
      // Clear any stale token
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthState(null);
    } finally {
      setIsLoggingIn(false);
    }
  }, [address, isLoggingIn, signMessageAsync]);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthState(null);
  };

  // Effect to handle automatic login on wallet connect
  useEffect(() => {
    if (isConnected && !authState && !isLoggingIn) {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        handleLogin();
      }
    }
  }, [isConnected, authState, isLoggingIn, handleLogin]);

  // Effect to verify token on initial load
  useEffect(() => {
    const handleVerifyToken = async (token: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
          // Silently fail and let the catch block handle token removal
          return;
        }
        const data = await res.json();
        setAuthState({ token, user: data });
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    };

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      handleVerifyToken(token);
    }
  }, []);


  // --- Render ---
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <NetworkSwitcher />
      <div className="container mx-auto px-4 py-8 pt-16">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            NFT Ticket Marketplace
          </h1>
          <div className="flex items-center space-x-4">
            <ConnectButton />
            {isConnected && !authState && (
              <button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            )}
            {authState && (
               <div className="flex items-center space-x-4">
                 <Link href="/my-tickets" className="text-sm font-medium hover:text-purple-400 transition-colors">
                    My Tickets
                 </Link>
                 <span className="text-sm text-gray-300">Welcome, {authState.user.wallet_address.slice(0, 6)}...{authState.user.wallet_address.slice(-4)}</span>
                 <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
                   Logout
                 </button>
               </div>
            )}
          </div>
        </header>

        <div>
          <h2 className="text-3xl font-bold mb-8 text-center">Upcoming Events</h2>
          {loading && <div className="text-center text-xl text-gray-400">Loading events...</div>}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
              <p className="font-bold">Failed to load events</p>
              <p className="text-sm mt-2">Please ensure the backend server is running.</p>
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div key={event.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-transform hover:scale-105 hover:border-purple-400">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-blue-300">{event.name}</h3>
                    <p className="text-sm text-gray-400">{event.location}</p>
                  </div>
                  <div className="text-sm space-y-2 mb-6">
                    <p><span className="font-semibold">Date:</span> {event.date}</p>
                    <p><span className="font-semibold">Price:</span> {event.price}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-bold py-2 rounded-lg transition-all">
                      View Details
                    </button>
                    <Link href={`/market/${event.id}`} className="flex-1 text-center bg-gray-600 hover:bg-gray-700 font-bold py-2 rounded-lg transition-all">
                      View Market
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
