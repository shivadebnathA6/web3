import React, { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import Approve from './components/Approve';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);

  return (
    <div className="App">
      <h1>Crypto Fund Management</h1>
      <WalletConnect setAccount={setAccount} />
      {account && <Approve account={account} />}
    </div>
  );
}

export default App;
