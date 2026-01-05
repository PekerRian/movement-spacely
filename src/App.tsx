import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AptosWalletAdapterProvider, useWallet } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { PrivyProvider } from '@privy-io/react-auth';
import './App.css';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import Community from './pages/Community';
import ProfileRegistrationModal from './components/ProfileRegistrationModal';
import WalletSelector from './components/WalletSelector';
const CONFIG = {
  moduleAddress: 'a33869c482c817859d4043da2a9c264a95da932812d1c1d4de24f46a168c3917',
  network: 'testnet',
};
const PRIVY_APP_ID = 'cmjnr5r4o01r5jh0cy2za0zaj';
const wallets = [new PetraWallet()];
function App() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#ffd700',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'off',
        },
      }}
    >
      <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
        <Router>
          <AppContent />
        </Router>
      </AptosWalletAdapterProvider>
    </PrivyProvider>
  );
}
function AppContent() {
  const { connect, disconnect, account, connected } = useWallet();
  const [hasProfile, setHasProfile] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const walletAddress = account?.address?.toString() || null;
  const walletConnected = connected;
  const checkProfileExists = async (address: string): Promise<boolean> => {
    try {
      setIsCheckingProfile(true);
      console.log('Checking profile for address:', address);
      await new Promise(resolve => setTimeout(resolve, 800));
      return false;
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    } finally {
      setIsCheckingProfile(false);
    }
  };
  useEffect(() => {
    if (connected && account?.address) {
      const checkAndShowModal = async () => {
        const profileExists = await checkProfileExists(account.address.toString());
        setHasProfile(profileExists);
        if (!profileExists) {
          setShowRegistrationModal(true);
          localStorage.setItem('spacely_registration_pending', 'true');
        }
      };
      checkAndShowModal();
    } else {
      setHasProfile(false);
      setShowRegistrationModal(false);
    }
  }, [connected, account?.address]);
  useEffect(() => {
    const registrationPending = localStorage.getItem('spacely_registration_pending');
    if (registrationPending === 'true' && connected) {
      setShowRegistrationModal(true);
    }
  }, []);
  useEffect(() => {
    const registrationPending = localStorage.getItem('spacely_registration_pending');
    if (registrationPending === 'true' && connected && account?.address) {
      setShowRegistrationModal(true);
    }
  }, [connected, account?.address]);
  const connectWallet = async () => {
    try {
      setShowWalletSelector(true);
    } catch (error) {
      console.error('Error opening wallet selector:', error);
    }
  };
  const disconnectWallet = async () => {
    try {
      await disconnect();
      setHasProfile(false);
      setShowRegistrationModal(false);
      localStorage.removeItem('spacely_registration_pending');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };
  const handleProfileCreated = () => {
    setHasProfile(true);
    setShowRegistrationModal(false);
    localStorage.removeItem('spacely_registration_pending');
    alert('✨ Profile created successfully! Check browser console for transaction hash.');
  };
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  return (
    <div className="app">
      <Navigation
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        formatAddress={formatAddress}
        isCheckingProfile={isCheckingProfile}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar walletConnected={walletConnected} />} />
          <Route path="/profile" element={<Profile walletConnected={walletConnected} walletAddress={walletAddress} />} />
          <Route path="/community" element={<Community walletConnected={walletConnected} />} />
        </Routes>
      </main>
      { }
      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
      />
      { }
      {walletAddress && (
        <ProfileRegistrationModal
          isOpen={showRegistrationModal}
          walletAddress={walletAddress}
          onClose={() => setShowRegistrationModal(false)}
          onProfileCreated={handleProfileCreated}
        />
      )}
    </div>
  );
}
interface NavigationProps {
  walletConnected: boolean;
  walletAddress: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  formatAddress: (address: string) => string;
  isCheckingProfile: boolean;
}
function Navigation({ walletConnected, walletAddress, connectWallet, disconnectWallet, formatAddress, isCheckingProfile }: NavigationProps) {
  const location = useLocation();
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">Spacely</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </Link>
          <Link to="/calendar" className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}>
            <span className="nav-icon">📅</span>
            <span>Calendar</span>
          </Link>
          <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
            <span className="nav-icon">👤</span>
            <span>Profile</span>
          </Link>
          <Link to="/community" className={`nav-link ${isActive('/community') ? 'active' : ''}`}>
            <span className="nav-icon">🌍</span>
            <span>Community</span>
          </Link>
        </div>
        <div className="nav-actions">
          {!walletConnected ? (
            <button className="connect-wallet-btn" onClick={connectWallet} disabled={isCheckingProfile}>
              <span className="btn-icon">{isCheckingProfile ? '⏳' : '🔗'}</span>
              <span>{isCheckingProfile ? 'Checking...' : 'Connect Wallet'}</span>
            </button>
          ) : (
            <div className="wallet-info">
              <div className="wallet-address">
                {walletAddress && formatAddress(walletAddress)}
              </div>
              <button className="disconnect-btn" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
export default App;
