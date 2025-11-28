import React, { useState } from 'react';
import { ethers } from 'ethers';
import { ADDRESSES, ABIS } from '../contracts/config';
import { Card, Button, Input, Badge } from '../components/ui';
import { Search, ShieldCheck, Clock, User, Box, History } from 'lucide-react';

export default function Overview({ provider }: { provider: ethers.BrowserProvider | null }) {
  const [traceId, setTraceId] = useState('');
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrace = async () => {
    if (!provider || !traceId) return;
    setLoading(true);
    setError('');
    setTraceData(null);

    try {
      const productRegistry = new ethers.Contract(ADDRESSES.PRODUCT_REGISTRY, ABIS.PRODUCT_REGISTRY, provider);
      const ownershipMgr = new ethers.Contract(ADDRESSES.OWNERSHIP_MANAGER, ABIS.OWNERSHIP, provider);
      const warrantyMgr = new ethers.Contract(ADDRESSES.WARRANTY_MANAGER, ABIS.WARRANTY, provider);
      const nftContract = new ethers.Contract(ADDRESSES.WATCH_NFT, ABIS.NFT, provider);

      const [product, history, warranty, nftTokenId] = await Promise.all([
        productRegistry.getProduct(traceId).catch(() => null),
        ownershipMgr.getOwnershipHistory(traceId).catch(() => []),
        warrantyMgr.getWarranty(traceId).catch(() => null),
        nftContract.productToToken(traceId).catch(() => 0n)
      ]);

      if (!product || product.productId.toString() === '0') {
        throw new Error("Product not found");
      }

      // Calculate Risk Score
      let score = 100;
      const transfers = history.length > 0 ? history.length - 1 : 0;
      const claims = warranty ? Number(warranty.claimCount) : 0;
      const isExpired = warranty ? (Date.now() / 1000 > Number(warranty.expirationDate)) : false;

      score -= transfers * 5;
      score -= claims * 15;
      if (isExpired) score -= 10;
      if (!warranty) score -= 20;

      setTraceData({
        product,
        history,
        warranty,
        nftTokenId: Number(nftTokenId),
        score: Math.max(0, score)
      });
    } catch (err: any) {
      setError(err.message || "Failed to trace product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Trace & Verify" icon={Search} className="md:col-span-2">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input 
                label="Product ID" 
                placeholder="e.g. 1" 
                value={traceId} 
                onChange={(e: any) => setTraceId(e.target.value)} 
              />
            </div>
            <div className="mb-4">
              <Button onClick={handleTrace} loading={loading} disabled={!provider}>
                Trace Product
              </Button>
            </div>
          </div>
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm mt-2">{error}</div>}
        </Card>

        {traceData && (
          <>
            <Card title="Risk Assessment" icon={ShieldCheck}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Trust Score</span>
                <span className={`text-2xl font-bold ${traceData.score > 80 ? 'text-green-400' : traceData.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {traceData.score}/100
                </span>
              </div>
              <div className="w-full bg-surfaceHighlight rounded-full h-2.5 mb-6 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full ${traceData.score > 80 ? 'bg-green-500' : traceData.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                  style={{ width: `${traceData.score}%` }}
                ></div>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Warranty Status</span>
                  <Badge color={traceData.warranty?.active ? 'green' : 'red'}>
                    {traceData.warranty?.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Claims Made</span>
                  <span>{traceData.warranty ? traceData.warranty.claimCount.toString() : 0} / {traceData.warranty ? traceData.warranty.maxClaims.toString() : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>NFT Certificate</span>
                  <span>{traceData.nftTokenId > 0 ? `#${traceData.nftTokenId}` : 'Not Minted'}</span>
                </div>
              </div>
            </Card>

            <Card title="Product Details" icon={Box}>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Model</label>
                  <div className="font-medium">{traceData.product.model}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Serial Number</label>
                  <div className="font-mono text-sm bg-surfaceHighlight/50 p-1.5 rounded inline-block text-primary">
                    {traceData.product.serialNumber}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Manufacturer</label>
                  <div className="text-xs text-gray-400 break-all">{traceData.product.manufacturer}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Manufactured Date</label>
                  <div>{new Date(Number(traceData.product.manufactureTimestamp) * 1000).toLocaleDateString()}</div>
                </div>
              </div>
            </Card>

            <Card title="Ownership Journey" icon={History} className="md:col-span-2">
              <div className="relative pl-6 border-l-2 border-surfaceHighlight space-y-8 my-4">
                {traceData.history.map((record: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] bg-background border-2 border-primary w-4 h-4 rounded-full"></div>
                    <div className="bg-surfaceHighlight/30 p-4 rounded-lg">
                      <div className="text-xs text-primary mb-1">
                        {new Date(Number(record.timestamp) * 1000).toLocaleString()}
                      </div>
                      <div className="text-sm font-medium text-white mb-1">
                        {idx === 0 ? 'Initialized by Manufacturer' : `Transferred to Owner #${idx}`}
                      </div>
                      <div className="text-xs font-mono text-gray-400 break-all">
                        {record.owner}
                      </div>
                    </div>
                  </div>
                ))}
                {traceData.history.length === 0 && (
                  <div className="text-gray-500 italic">No ownership history found.</div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}