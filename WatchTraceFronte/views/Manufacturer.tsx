import React, { useState } from 'react';
import { ethers } from 'ethers';
import { ADDRESSES, ABIS } from '../contracts/config';
import { Card, Button, Input } from '../components/ui';
import { Factory, Award, UserPlus, FileBadge } from 'lucide-react';

export default function Manufacturer({ signer }: { signer: ethers.Signer }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Forms State
  const [register, setRegister] = useState({ serial: '', model: '' });
  const [initOwn, setInitOwn] = useState({ id: '', owner: '' });
  const [warranty, setWarranty] = useState({ id: '', duration: '', claims: '' });
  const [mint, setMint] = useState({ id: '', to: '' });

  const handleTx = async (action: string, fn: () => Promise<any>) => {
    setLoading(action);
    setStatus(null);
    try {
      const tx = await fn();
      const receipt = await tx.wait();

      let message = `${action} successful!`;

      // Try to extract productId from ProductRegistered event for registration
      if (action === 'Registration') {
        try {
          const iface = new ethers.Interface(ABIS.PRODUCT_REGISTRY as any);
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog(log);
              if (parsed && parsed.name === 'ProductRegistered') {
                const productId = parsed.args.productId?.toString?.() ?? String(parsed.args[0]);
                message = `${action} successful! Product ID: ${productId}`;
                break;
              }
            } catch {
              // Ignore logs that do not match the event
            }
          }
        } catch (e) {
          console.error('Failed to parse ProductRegistered event', e);
        }
      }

      setStatus({ msg: message, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setStatus({ msg: err.reason || err.message, type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {status && (
        <div className={`p-4 rounded-lg border ${status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {status.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Register Product" icon={Factory}>
          <Input 
            label="Model Name" 
            value={register.model} 
            onChange={(e: any) => setRegister({...register, model: e.target.value})}
            placeholder="e.g. Rolex Submariner"
          />
          <Input 
            label="Serial Number" 
            value={register.serial} 
            onChange={(e: any) => setRegister({...register, serial: e.target.value})}
            placeholder="e.g. SN-2024-001"
          />
          <Button 
            onClick={() => handleTx('Registration', async () => {
              const contract = new ethers.Contract(ADDRESSES.PRODUCT_REGISTRY, ABIS.PRODUCT_REGISTRY, signer);
              return contract.registerProduct(register.serial, register.model);
            })}
            loading={loading === 'Registration'}
            disabled={!!loading}
          >
            Register Watch
          </Button>
        </Card>

        <Card title="Initialize Ownership" icon={UserPlus}>
          <Input 
            label="Product ID" 
            value={initOwn.id} 
            onChange={(e: any) => setInitOwn({...initOwn, id: e.target.value})}
          />
          <Input 
            label="First Owner Address" 
            value={initOwn.owner} 
            onChange={(e: any) => setInitOwn({...initOwn, owner: e.target.value})}
            placeholder="0x..."
          />
          <Button 
            onClick={() => handleTx('Init Ownership', async () => {
              const contract = new ethers.Contract(ADDRESSES.OWNERSHIP_MANAGER, ABIS.OWNERSHIP, signer);
              return contract.initializeOwnership(initOwn.id, initOwn.owner);
            })}
            loading={loading === 'Init Ownership'}
            disabled={!!loading}
          >
            Set Owner
          </Button>
        </Card>

        <Card title="Issue Warranty" icon={Award}>
          <Input 
            label="Product ID" 
            value={warranty.id} 
            onChange={(e: any) => setWarranty({...warranty, id: e.target.value})}
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <Input 
                label="Duration (Days)" 
                value={warranty.duration} 
                onChange={(e: any) => setWarranty({...warranty, duration: e.target.value})}
              />
            </div>
            <div className="flex-1">
              <Input 
                label="Max Claims" 
                value={warranty.claims} 
                onChange={(e: any) => setWarranty({...warranty, claims: e.target.value})}
              />
            </div>
          </div>
          <Button 
            onClick={() => handleTx('Issue Warranty', async () => {
              const contract = new ethers.Contract(ADDRESSES.WARRANTY_MANAGER, ABIS.WARRANTY, signer);
              return contract.issueWarranty(warranty.id, warranty.duration, warranty.claims);
            })}
            loading={loading === 'Issue Warranty'}
            disabled={!!loading}
          >
            Activate Warranty
          </Button>
        </Card>

        <Card title="Mint NFT" icon={FileBadge}>
           <Input 
            label="Product ID" 
            value={mint.id} 
            onChange={(e: any) => setMint({...mint, id: e.target.value})}
          />
          <Input 
            label="Recipient Address" 
            value={mint.to} 
            onChange={(e: any) => setMint({...mint, to: e.target.value})}
            placeholder="0x..."
          />
          <Button 
            onClick={() => handleTx('Mint NFT', async () => {
              const contract = new ethers.Contract(ADDRESSES.WATCH_NFT, ABIS.NFT, signer);
              return contract.mintForProduct(mint.id, mint.to);
            })}
            loading={loading === 'Mint NFT'}
            disabled={!!loading}
          >
            Mint Certificate
          </Button>
        </Card>
      </div>
    </div>
  );
}
