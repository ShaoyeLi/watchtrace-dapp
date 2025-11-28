import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ADDRESSES, ABIS } from '../contracts/config';

declare global {
  interface Window {
    ethereum: any;
  }
}

export interface Roles {
  isAdmin: boolean;
  isManufacturer: boolean;
  isServiceCenter: boolean;
  isCustomer: boolean;
}

export function useWeb3() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [roles, setRoles] = useState<Roles>({
    isAdmin: false,
    isManufacturer: false,
    isServiceCenter: false,
    isCustomer: true
  });
  const [loading, setLoading] = useState(false);

  const detectRoles = async (userAccount: string, web3Provider: ethers.BrowserProvider) => {
    try {
      const aclContract = new ethers.Contract(ADDRESSES.ACL, ABIS.ACL, web3Provider);
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      const MANUFACTURER_ROLE = ethers.id("MANUFACTURER_ROLE");
      const SERVICE_CENTER_ROLE = ethers.id("SERVICE_CENTER_ROLE");

      const [isAdmin, isManufacturer, isServiceCenter] = await Promise.all([
        aclContract.hasRole(DEFAULT_ADMIN_ROLE, userAccount),
        aclContract.hasRole(MANUFACTURER_ROLE, userAccount),
        aclContract.hasRole(SERVICE_CENTER_ROLE, userAccount)
      ]);

      setRoles({
        isAdmin,
        isManufacturer,
        isServiceCenter,
        isCustomer: !isManufacturer && !isServiceCenter && !isAdmin
      });
    } catch (error) {
      console.error("Failed to detect roles:", error);
    }
  };

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        await web3Provider.send("eth_requestAccounts", []);
        const web3Signer = await web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(address);
        
        await detectRoles(address, web3Provider);
      } catch (error) {
        console.error("Connection error:", error);
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please install MetaMask!");
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setAccount(null);
          setSigner(null);
          setRoles({ isAdmin: false, isManufacturer: false, isServiceCenter: false, isCustomer: true });
        }
      });
    }
  }, [connectWallet]);

  return { account, provider, signer, roles, connectWallet, loading };
}