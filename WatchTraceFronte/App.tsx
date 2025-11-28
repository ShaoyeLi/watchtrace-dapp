import React, { useState } from 'react';
import { useWeb3 } from './hooks/useWeb3';
import Overview from './views/Overview';
import Manufacturer from './views/Manufacturer';
import Customer from './views/Customer';
import Service from './views/Service';
import { LayoutDashboard, Factory, User, PenTool, Wallet, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const { account, provider, signer, roles, connectWallet, loading } = useWeb3();
  const [view, setView] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, show: true },
    { id: 'manufacturer', label: 'Manufacturer', icon: Factory, show: roles.isManufacturer || roles.isAdmin },
    { id: 'customer', label: 'My Watches', icon: User, show: roles.isCustomer || !account },
    { id: 'service', label: 'Service Center', icon: Shield, show: roles.isServiceCenter || roles.isAdmin },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="border-b border-surfaceHighlight bg-surface/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
             <div>
                <h1 className="text-xl font-bold tracking-tight text-white">WatchTrace</h1>
                <p className="text-xs text-gray-500">Blockchain Provenance System</p>
             </div>
          </div>
          
          <button 
            onClick={connectWallet}
            disabled={!!account}
            className="flex items-center gap-2 px-4 py-2 bg-surfaceHighlight rounded-full text-sm font-medium hover:bg-surfaceHighlight/80 transition-colors border border-surfaceHighlight"
          >
            <Wallet className="w-4 h-4 text-primary" />
            {account ? (
              <span className="font-mono text-primary">
                {account.substring(0,6)}...{account.substring(account.length-4)}
              </span>
            ) : (
              loading ? 'Connecting...' : 'Connect Wallet'
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-surfaceHighlight/30 p-1.5 rounded-xl w-fit">
          {navItems.filter(i => i.show).map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === item.id 
                ? 'bg-primary text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                : 'text-gray-400 hover:text-white hover:bg-surfaceHighlight'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Roles Indicator */}
        {account && (
            <div className="mb-6 flex gap-2">
                {roles.isAdmin && <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded">Admin</span>}
                {roles.isManufacturer && <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">Manufacturer</span>}
                {roles.isServiceCenter && <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded">Service Center</span>}
            </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'overview' && <Overview provider={provider} />}
            {view === 'manufacturer' && signer && <Manufacturer signer={signer} />}
            {view === 'customer' && provider && account && <Customer provider={provider} signer={signer || undefined} account={account} />}
            {view === 'service' && signer && <Service provider={provider} signer={signer} />}
            
            {view !== 'overview' && !provider && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Wallet className="w-12 h-12 mb-4 opacity-50" />
                    <p>Please connect your wallet to access this section.</p>
                </div>
            )}
          </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}