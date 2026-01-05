import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState } from 'react';
import './WalletSelector.css';
interface WalletSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}
function WalletSelector({ isOpen, onClose }: WalletSelectorProps) {
    const { wallets, connect } = useWallet();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');
    const handleWalletConnect = async (walletName: string) => {
        try {
            setIsConnecting(true);
            setError('');
            await connect(walletName);
            onClose();
        } catch (err) {
            console.error('Wallet connection error:', err);
            setError('Failed to connect wallet. Please try again.');
        } finally {
            setIsConnecting(false);
        }
    };
    if (!isOpen) return null;
    const availableWallets = wallets.filter(wallet => wallet.readyState === 'Installed');
    const notInstalledWallets = wallets.filter(wallet => wallet.readyState === 'NotDetected');
    return (
        <div className="modal active" onClick={onClose}>
            <div className="modal-content wallet-selector-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Connect Wallet</h2>
                        <p className="modal-subtitle">Choose your preferred wallet</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="wallet-list">
                    {availableWallets.length > 0 ? (
                        <>
                            <div className="wallet-section">
                                <h3 className="wallet-section-title">Available Wallets</h3>
                                {availableWallets.map((wallet) => (
                                    <button
                                        key={wallet.name}
                                        className="wallet-option"
                                        onClick={() => handleWalletConnect(wallet.name)}
                                        disabled={isConnecting}
                                    >
                                        <div className="wallet-info">
                                            {wallet.icon && (
                                                <img
                                                    src={wallet.icon}
                                                    alt={wallet.name}
                                                    className="wallet-icon"
                                                />
                                            )}
                                            <div className="wallet-details">
                                                <div className="wallet-name">{wallet.name}</div>
                                                <div className="wallet-status ready">Ready to connect</div>
                                            </div>
                                        </div>
                                        <span className="wallet-arrow">→</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="no-wallets">
                            <div className="no-wallets-icon">🔌</div>
                            <p>No wallet extensions detected</p>
                            <p className="no-wallets-hint">Please install a wallet extension to continue</p>
                        </div>
                    )}
                    {notInstalledWallets.length > 0 && (
                        <div className="wallet-section">
                            <h3 className="wallet-section-title">Not Installed</h3>
                            {notInstalledWallets.map((wallet) => (
                                <div key={wallet.name} className="wallet-option disabled">
                                    <div className="wallet-info">
                                        {wallet.icon && (
                                            <img
                                                src={wallet.icon}
                                                alt={wallet.name}
                                                className="wallet-icon grayscale"
                                            />
                                        )}
                                        <div className="wallet-details">
                                            <div className="wallet-name">{wallet.name}</div>
                                            <div className="wallet-status not-installed">Not installed</div>
                                        </div>
                                    </div>
                                    {wallet.url && (
                                        <a
                                            href={wallet.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="install-link"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Install
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}
                <div className="modal-footer">
                    <p className="info-text">
                        💡 New to crypto wallets? Install Petra or Nightly to get started with Movement/Aptos.
                    </p>
                </div>
            </div>
        </div>
    );
}
export default WalletSelector;
