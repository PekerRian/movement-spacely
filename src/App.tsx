import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AptosWalletAdapterProvider, useWallet } from '@aptos-labs/wallet-adapter-react';
import { PrivyProvider } from '@privy-io/react-auth';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { Home as HomeIcon, Calendar as CalendarIcon, User as UserIcon, Globe as GlobeIcon } from 'lucide-react';
import { MODULES, NETWORK_CONFIG } from './constants/contracts';
import './App.css';
import './stars.css';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import Community from './pages/Community';
import ProfileRegistrationModal from './components/ProfileRegistrationModal';
import WelcomeBackModal from './components/WelcomeBackModal';
import WalletSelector from './components/WalletSelector';
const PRIVY_APP_ID = 'cmjnr5r4o01r5jh0cy2za0zaj';
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
      }}
    >
      <AptosWalletAdapterProvider>
        <Router>
          <AppContent />
        </Router>
      </AptosWalletAdapterProvider>
    </PrivyProvider>
  );
}
function AppContent() {
  const { disconnect, account, connected } = useWallet();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [profileData, setProfileData] = useState<{ username: string; twitter: string } | null>(null);
  const walletAddress = account?.address?.toString() || null;
  const walletConnected = connected;

  // Initialize Aptos client
  const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: NETWORK_CONFIG.REST_URL
  });
  const aptos = new Aptos(config);

  const checkProfileExists = async (address: string): Promise<boolean> => {
    try {
      setIsCheckingProfile(true);
      console.log('Checking profile for address:', address);

      const result = await aptos.view({
        payload: {
          function: MODULES.PROFILE.GET_PROFILE,
          typeArguments: [],
          functionArguments: [address]
        }
      });

      if (result && result.length >= 2) {
        const [username, twitter] = result;
        setProfileData({
          username: username as string,
          twitter: twitter as string
        });
        return true;
      }
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
        if (profileExists) {
          // Show welcome back modal for existing users
          setShowWelcomeBackModal(true);
          localStorage.removeItem('spacely_registration_pending');
        } else {
          // Show registration modal for new users
          setShowRegistrationModal(true);
          localStorage.setItem('spacely_registration_pending', 'true');
        }
      };
      checkAndShowModal();
    } else {
      setShowRegistrationModal(false);
      setShowWelcomeBackModal(false);
      setProfileData(null);
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
      setShowRegistrationModal(false);
      localStorage.removeItem('spacely_registration_pending');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };
  const handleProfileCreated = async () => {
    setShowRegistrationModal(false);
    localStorage.removeItem('spacely_registration_pending');

    // Fetch the newly created profile
    if (account?.address) {
      await checkProfileExists(account.address.toString());
    }

    alert('✨ Profile created successfully! Welcome to Spacely!');
  };
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  return (
    <div className="app">
      <div className="stars-container">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>
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
        <>
          <ProfileRegistrationModal
            isOpen={showRegistrationModal}
            walletAddress={walletAddress}
            onClose={() => setShowRegistrationModal(false)}
            onProfileCreated={handleProfileCreated}
          />
          <WelcomeBackModal
            isOpen={showWelcomeBackModal}
            username={profileData?.username || 'User'}
            walletAddress={walletAddress}
            onClose={() => setShowWelcomeBackModal(false)}
          />
        </>
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
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-icon">
            <img src="/public/logo.PNG" alt="Spacely Logo" className="nav-logo-img" />
          </div>
          <span className="logo-text">Spacely</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <HomeIcon size={20} color="#ffd700" strokeWidth={2} />
            <span>Home</span>
          </Link>
          <Link to="/calendar" className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}>
            <CalendarIcon size={20} color="#ffd700" strokeWidth={2} />
            <span>Calendar</span>
          </Link>
          <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
            <UserIcon size={20} color="#ffd700" strokeWidth={2} />
            <span>Profile</span>
          </Link>
          <Link to="/community" className={`nav-link ${isActive('/community') ? 'active' : ''}`}>
            <GlobeIcon size={20} color="#ffd700" strokeWidth={2} />
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
              <div
                className="wallet-address"
                onClick={handleCopyAddress}
                style={{ cursor: 'pointer', minWidth: '120px', textAlign: 'center' }}
                title="Click to copy full address"
              >
                {copied ? '✅ Copied!' : (walletAddress && formatAddress(walletAddress))}
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
