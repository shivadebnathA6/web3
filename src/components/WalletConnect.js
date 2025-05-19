import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

const BSC_MAINNET_CHAIN_ID = '0x38'; // Chain ID for BSC Mainnet (56 in decimal)

const WalletConnect = ({ setAccount }) => {
  const [error, setError] = useState('');

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BSC_MAINNET_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: BSC_MAINNET_CHAIN_ID }],
            });
          } catch (switchError) {
            // If the chain is not added to MetaMask, add it
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: BSC_MAINNET_CHAIN_ID,
                      chainName: 'Binance Smart Chain Mainnet',
                      nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18,
                      },
                      rpcUrls: ['https://bsc-dataseed.binance.org/'],
                      blockExplorerUrls: ['https://bscscan.com'],
                    },
                  ],
                });
              } catch (addError) {
                setError('Failed to add BSC Mainnet to wallet');
              }
            } else {
              setError('Please switch to BSC Mainnet in your wallet');
            }
          }
        }
      } else {
        setError('Please install MetaMask');
      }
    };
    checkNetwork();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
      } catch (err) {
        setError('Failed to connect wallet');
      }
    } else {
      setError('Please install MetaMask');
    }
  };

  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default WalletConnect; 