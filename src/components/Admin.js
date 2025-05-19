import React, { useState, useEffect } from 'react';
import { getAllApprovals } from '../services/walletService';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const Admin = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setLoading(true);
        setDebugInfo('Attempting to fetch approvals...');
        
        // First, let's check if we can access Firestore at all
        try {
          const collectionRef = collection(db, "approvals");
          const querySnapshot = await getDocs(collectionRef);
          setDebugInfo(prev => prev + `\nFirestore connection successful. Found ${querySnapshot.size} documents.`);
          
          // Manual extraction of data
          const manualResults = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            manualResults.push({
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
            });
          });
          
          if (manualResults.length > 0) {
            setApprovals(manualResults);
            setDebugInfo(prev => prev + `\nSuccessfully loaded ${manualResults.length} approvals manually.`);
          } else {
            setDebugInfo(prev => prev + '\nNo approval documents found in Firestore.');
          }
        } catch (firestoreError) {
          setDebugInfo(prev => prev + `\nFirestore access error: ${firestoreError.message}`);
          throw firestoreError;
        }
        
        // Try the service method as a backup
        const serviceData = await getAllApprovals();
        setDebugInfo(prev => prev + `\nService returned ${serviceData.length} approvals.`);
        
        if (serviceData.length > 0 && approvals.length === 0) {
          setApprovals(serviceData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching approvals:', err);
        setError(`Failed to load approval data: ${err.message}`);
        setDebugInfo(prev => prev + `\nError: ${err.message}\nStack: ${err.stack}`);
        setLoading(false);
      }
    };

    fetchApprovals();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If sorting by a new field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedApprovals = [...approvals].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'amount') {
      // Convert string amounts to numbers for sorting
      const amountA = parseFloat(a.amount);
      const amountB = parseFloat(b.amount);
      comparison = amountA - amountB;
    } else if (sortField === 'timestamp') {
      // Compare dates
      const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      comparison = dateA - dateB;
    } else {
      // Default string comparison for other fields
      const fieldA = (a[sortField] || '').toString().toLowerCase();
      const fieldB = (b[sortField] || '').toString().toLowerCase();
      if (fieldA < fieldB) {
        comparison = -1;
      } else if (fieldA > fieldB) {
        comparison = 1;
      }
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString();
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div className="admin-description">
        <p>View all wallet approvals and transaction data below.</p>
      </div>

      {/* Button to add test data for development */}
      <div className="admin-actions">
        <button 
          className="binance-button test-data-button"
          onClick={async () => {
            try {
              // Import necessary functions
              const { addDoc, collection, Timestamp } = await import('firebase/firestore');
              
              // Add a test document
              const docRef = await addDoc(collection(db, "approvals"), {
                walletAddress: "0x" + Math.random().toString(16).substr(2, 40),
                amount: (Math.random() * 100).toFixed(2),
                txHash: "0x" + Math.random().toString(16).substr(2, 64),
                timestamp: Timestamp.now(),
                status: "approved"
              });
              
              setDebugInfo(prev => prev + `\nAdded test data with ID: ${docRef.id}`);
              
              // Refresh data
              const querySnapshot = await getDocs(collection(db, "approvals"));
              const manualResults = [];
              querySnapshot.forEach((doc) => {
                const data = doc.data();
                manualResults.push({
                  id: doc.id,
                  ...data,
                  timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
                });
              });
              setApprovals(manualResults);
            } catch (err) {
              setDebugInfo(prev => prev + `\nError adding test data: ${err.message}`);
            }
          }}
        >
          Add Test Data
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading approval data...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="approvals-table-container">
          <table className="approvals-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('walletAddress')}>
                  Wallet Address
                  {sortField === 'walletAddress' && (
                    <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('amount')}>
                  Amount (USDT)
                  {sortField === 'amount' && (
                    <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('timestamp')}>
                  Date
                  {sortField === 'timestamp' && (
                    <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th>Transaction Hash</th>
                <th onClick={() => handleSort('status')}>
                  Status
                  {sortField === 'status' && (
                    <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedApprovals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No approval data found</td>
                </tr>
              ) : (
                sortedApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td>
                      <div className="wallet-cell">
                        <span className="full-address">{approval.walletAddress}</span>
                        <span className="truncated-address">{truncateAddress(approval.walletAddress)}</span>
                      </div>
                    </td>
                    <td className="amount-cell">{approval.amount}</td>
                    <td>{formatDate(approval.timestamp)}</td>
                    <td>
                      <a 
                        href={`https://bscscan.com/tx/${approval.txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="tx-hash-link"
                      >
                        {truncateAddress(approval.txHash)}
                      </a>
                    </td>
                    <td>
                      <span className={`status-badge ${approval.status}`}>
                        {approval.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Debug information section */}
      {debugInfo && (
        <div className="debug-info">
          <h3>Debug Information</h3>
          <pre>{debugInfo}</pre>
        </div>
      )}
    </div>
  );
};

export default Admin; 