import React, { useState } from 'react';
import { ethers } from 'ethers';
import { ADDRESSES, ABIS } from '../contracts/config';
import { Card, Button, Input } from '../components/ui';
import { ClipboardList, CheckCircle } from 'lucide-react';

export default function Service({ provider, signer }: { provider: ethers.BrowserProvider, signer: ethers.Signer }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    const queue = [];
    try {
      const productRegistry = new ethers.Contract(ADDRESSES.PRODUCT_REGISTRY, ABIS.PRODUCT_REGISTRY, provider);
      const warrantyMgr = new ethers.Contract(ADDRESSES.WARRANTY_MANAGER, ABIS.WARRANTY, provider);
      
      const total = await productRegistry.nextProductId();
      const max = Math.min(Number(total), 50); // Demo limit

      for (let i = 1; i < max; i++) {
        const reqs = await warrantyMgr.getWarrantyRequests(i);
        // Map requests to include index for approval
        reqs.forEach((r: any, idx: number) => {
            if (!r.approved) {
                queue.push({
                    productId: i,
                    requestIdx: idx,
                    requester: r.requester,
                    timestamp: r.timestamp
                });
            }
        });
      }
      setRequests(queue);
    } catch (e) {
      console.error(e);
      alert("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (pid: number, idx: number) => {
    setProcessing(`${pid}-${idx}`);
    try {
        const contract = new ethers.Contract(ADDRESSES.WARRANTY_MANAGER, ABIS.WARRANTY, signer);
        const tx = await contract.approveWarranty(pid, idx);
        await tx.wait();
        setRequests(requests.filter(r => !(r.productId === pid && r.requestIdx === idx)));
        alert("Approved!");
    } catch (e: any) {
        alert(e.message);
    } finally {
        setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Service Queue</h2>
            <Button onClick={loadQueue} loading={loading}>Scan Pending Requests</Button>
        </div>

        {requests.length === 0 && !loading && (
             <div className="text-center py-12 bg-surfaceHighlight/30 rounded-xl border border-dashed border-gray-700">
                <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No pending warranty claims found.</p>
            </div>
        )}

        <div className="space-y-4">
            {requests.map((req) => (
                <Card key={`${req.productId}-${req.requestIdx}`} className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm font-mono">Product #{req.productId}</span>
                             <span className="text-gray-400 text-sm">{new Date(Number(req.timestamp) * 1000).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-gray-300">
                            Requester: <span className="font-mono text-gray-400">{req.requester}</span>
                        </div>
                    </div>
                    <Button 
                        onClick={() => approve(req.productId, req.requestIdx)}
                        loading={processing === `${req.productId}-${req.requestIdx}`}
                        className="w-full md:w-auto"
                    >
                        <CheckCircle className="w-4 h-4" /> Approve Claim
                    </Button>
                </Card>
            ))}
        </div>
    </div>
  );
}