import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ADDRESSES, ABIS } from '../contracts/config';
import { Card, Button, Input, Badge } from '../components/ui';
import { Watch, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Customer({ provider, signer, account }: { provider: ethers.BrowserProvider, signer: ethers.Signer, account: string }) {
  const [watches, setWatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Actions
  const [transferData, setTransferData] = useState<{to: string, id: string}>({to: '', id: ''});
  const [showTransfer, setShowTransfer] = useState<string | null>(null);

  const loadMyWatches = async () => {
    setLoading(true);
    const myAssets = [];
    try {
      const productRegistry = new ethers.Contract(ADDRESSES.PRODUCT_REGISTRY, ABIS.PRODUCT_REGISTRY, provider);
      const ownershipMgr = new ethers.Contract(ADDRESSES.OWNERSHIP_MANAGER, ABIS.OWNERSHIP, provider);
      const warrantyMgr = new ethers.Contract(ADDRESSES.WARRANTY_MANAGER, ABIS.WARRANTY, provider);
      
      // In a real production app, we would use The Graph. 
      // Here we iterate a reasonable amount or use events, but for safety with the provided ABI, 
      // we scan a limited range or rely on the user knowing ID. 
      // To improve UX, let's scan the first 20 IDs for demo purposes.
      const total = await productRegistry.nextProductId();
      const max = Math.min(Number(total), 50); 

      for (let i = 1; i < max; i++) {
        const owner = await ownershipMgr.currentOwner(i);
        if (owner.toLowerCase() === account.toLowerCase()) {
          const product = await productRegistry.getProduct(i);
          const warranty = await warrantyMgr.getWarranty(i).catch(() => null);
          myAssets.push({ id: i, product, warranty });
        }
      }
      setWatches(myAssets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyWatches();
  }, [account]);

  const handleClaim = async (id: string) => {
    setActionLoading(`claim-${id}`);
    try {
        const contract = new ethers.Contract(ADDRESSES.WARRANTY_MANAGER, ABIS.WARRANTY, signer);
        const tx = await contract.requestWarranty(id);
        await tx.wait();
        alert("Claim submitted successfully!");
        loadMyWatches();
    } catch (e: any) {
        alert("Error: " + (e.reason || e.message));
    } finally {
        setActionLoading(null);
    }
  };

  const handleTransfer = async (id: string) => {
    if (!transferData.to) return alert("Enter address");
    setActionLoading(`transfer-${id}`);
    try {
        // 1. Transfer Ownership
        const ownContract = new ethers.Contract(ADDRESSES.OWNERSHIP_MANAGER, ABIS.OWNERSHIP, signer);
        const tx1 = await ownContract.transferOwnership(id, transferData.to);
        await tx1.wait();

        // 2. Try Transfer NFT (If exists) - Simple implementation
        try {
            const nftContract = new ethers.Contract(ADDRESSES.WATCH_NFT, ABIS.NFT, signer);
            const tokenId = await nftContract.productToToken(id);
            if (Number(tokenId) > 0) {
                const tx2 = await nftContract.transferFrom(account, transferData.to, tokenId);
                await tx2.wait();
            }
        } catch (e) {
            console.log("NFT transfer failed or not needed", e);
        }

        alert("Transfer complete!");
        setShowTransfer(null);
        loadMyWatches();
    } catch (e: any) {
        alert("Error: " + (e.reason || e.message));
    } finally {
        setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">My Collection</h2>
        <Button variant="secondary" onClick={loadMyWatches} loading={loading}>Refresh</Button>
      </div>

      {watches.length === 0 && !loading && (
        <div className="text-center py-12 bg-surfaceHighlight/30 rounded-xl border border-dashed border-gray-700">
            <Watch className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No watches found in this wallet (ID 1-50).</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {watches.map((w) => (
            <Card key={w.id} className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <Watch className="w-24 h-24 text-surfaceHighlight transform rotate-12 translate-x-8 -translate-y-8" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <Badge color="blue">ID: {w.id}</Badge>
                        <Badge color={w.warranty?.active ? 'green' : 'gray'}>
                            {w.warranty?.active ? 'Warranty Active' : 'No Warranty'}
                        </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1">{w.product.model}</h3>
                    <p className="text-sm text-primary font-mono mb-4">{w.product.serialNumber}</p>

                    <div className="space-y-3 pt-4 border-t border-surfaceHighlight">
                        {w.warranty?.active && (
                            <Button 
                                variant="secondary" 
                                className="w-full text-sm"
                                onClick={() => handleClaim(w.id)}
                                loading={actionLoading === `claim-${w.id}`}
                            >
                                <AlertTriangle className="w-4 h-4" /> Request Service
                            </Button>
                        )}
                        
                        <Button 
                            variant="primary" 
                            className="w-full text-sm"
                            onClick={() => {
                                setShowTransfer(showTransfer === w.id ? null : w.id);
                                setTransferData({to: '', id: w.id});
                            }}
                        >
                            <Send className="w-4 h-4" /> Transfer
                        </Button>
                    </div>

                    {showTransfer === w.id && (
                        <div className="mt-4 pt-4 border-t border-surfaceHighlight animate-in slide-in-from-top-2">
                             <Input 
                                label="New Owner Address"
                                placeholder="0x..." 
                                value={transferData.to}
                                onChange={(e: any) => setTransferData({...transferData, to: e.target.value})}
                             />
                             <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => handleTransfer(w.id)}
                                loading={actionLoading === `transfer-${w.id}`}
                             >
                                Confirm Transfer
                             </Button>
                        </div>
                    )}
                </div>
            </Card>
        ))}
      </div>
    </div>
  );
}