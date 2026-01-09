import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { MODULES } from '../constants/contracts';
import './ProfileRegistrationModal.css';
interface ProfileRegistrationModalProps {
    isOpen: boolean;
    walletAddress: string;
    onClose: () => void;
    onProfileCreated: () => void;
}

function ProfileRegistrationModal({ isOpen, walletAddress, onClose, onProfileCreated }: ProfileRegistrationModalProps) {
    const { login, logout, authenticated, user } = usePrivy();
    const { signAndSubmitTransaction } = useWallet();
    const [formData, setFormData] = useState({
        username: '',
        twitter: '',
        pfp: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (authenticated && user?.twitter) {
            let pfp = user?.twitter?.profilePictureUrl || '';
            if (pfp.includes('pbs.twimg.com')) {
                pfp = pfp.replace('_normal', '_400x400').replace('_bigger', '_400x400').replace('_mini', '_400x400');
            }
            setFormData(prev => ({
                ...prev,
                twitter: `@${user?.twitter?.username}`,
                pfp: pfp || prev.pfp
            }));
        }
    }, [authenticated, user]);
    const handleTwitterConnect = async () => {
        try {
            await login({
                loginMethods: ['twitter'],
            });
            if (user?.twitter) {
                let pfp = user?.twitter?.profilePictureUrl || '';
                if (pfp.includes('pbs.twimg.com')) {
                    pfp = pfp.replace('_normal', '_400x400').replace('_bigger', '_400x400').replace('_mini', '_400x400');
                }
                setFormData({
                    ...formData,
                    twitter: `@${user?.twitter?.username}`,
                    pfp: pfp || formData.pfp
                });
            }
        } catch (err) {
            console.error('Twitter connection error:', err);
            setError('Failed to connect Twitter. Please try again.');
        }
    };
    const handleTwitterDisconnect = async () => {
        try {
            await logout();
            setFormData({
                ...formData,
                twitter: '',
                pfp: ''
            });
        } catch (err) {
            console.error('Twitter disconnect error:', err);
            setError('Failed to disconnect Twitter. Please try again.');
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (formData.username.length < 3) {
                throw new Error('Username must be at least 3 characters');
            }
            const payload = {
                data: {
                    function: MODULES.PROFILE.CREATE_PROFILE,
                    typeArguments: [],
                    functionArguments: [
                        formData.username,
                        formData.twitter || '',
                        formData.pfp || ''
                    ]
                }
            };
            console.log('Submitting profile creation to blockchain:', payload);
            const response: any = await signAndSubmitTransaction(payload);
            console.log('Transaction response:', response);
            if (response && (response.hash || response.transactionHash)) {
                const txHash = response.hash || response.transactionHash;
                console.log('Transaction submitted! Hash:', txHash);
                await new Promise(resolve => setTimeout(resolve, 2000));
                onProfileCreated();
                setFormData({ username: '', twitter: '', pfp: '' });
            } else {
                throw new Error('Transaction failed - no hash returned');
            }
        } catch (err: any) {
            console.error('Profile creation error:', err);
            let errorMessage = 'Failed to create profile';
            if (err.message) {
                errorMessage = err.message;
            }
            if (err.message?.includes('E_PROFILE_EXISTS')) {
                errorMessage = 'Profile already exists for this wallet';
            } else if (err.message?.includes('rejected')) {
                errorMessage = 'Transaction was rejected';
            } else if (err.message?.includes('insufficient')) {
                errorMessage = 'Insufficient funds for gas fees';
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };;
    if (!isOpen) return null;
    const isPending = localStorage.getItem('spacely_registration_pending') === 'true';
    return (
        <div className="modal active" onClick={(e) => {
            if (!isPending && e.target === e.currentTarget) {
                onClose();
            }
        }}>
            <div className="modal-content registration-modal">
                <div className="modal-header">
                    <div>
                        <h2>Welcome to Spacely! 🚀</h2>
                        <p className="modal-subtitle">Create your profile to get started</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="wallet-display">
                        <span className="wallet-label">Connected Wallet:</span>
                        <span className="wallet-value">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                    </div>
                    <div className="form-group">
                        <label>
                            Username <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Choose a unique username"
                            required
                            minLength={3}
                            maxLength={20}
                            disabled={isLoading}
                        />
                        <span className="form-hint">3-20 characters, unique on the platform</span>
                    </div>
                    <div className="form-group">
                        <label>Twitter Handle</label>
                        <div className="twitter-connect-container">
                            <input
                                type="text"
                                value={formData.twitter}
                                placeholder="Connect Twitter to auto-fill"
                                readOnly
                                disabled={isLoading}
                                className="readonly-input"
                            />
                            <button
                                type="button"
                                className={authenticated && user?.twitter ? 'twitter-disconnect-btn' : 'twitter-connect-btn'}
                                onClick={authenticated && user?.twitter ? handleTwitterDisconnect : handleTwitterConnect}
                                disabled={isLoading}
                            >
                                {authenticated && user?.twitter ? (
                                    <>
                                        <span className="twitter-icon">✕</span>
                                        Disconnect
                                    </>
                                ) : (
                                    <>
                                        <span className="twitter-icon">🐦</span>
                                        Connect Twitter
                                    </>
                                )}
                            </button>
                        </div>
                        <span className="form-hint">Connect with Twitter to auto-fill your handle and profile picture</span>
                    </div>
                    {formData.pfp && (
                        <div className="form-group">
                            <label>Profile Picture</label>
                            <div className="pfp-preview">
                                <img src={formData.pfp} alt="Profile preview" />
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating Profile...
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">✨</span>
                                    Create Profile
                                </>
                            )}
                        </button>
                    </div>
                </form>
                <div className="modal-footer">
                    <p className="info-text">
                        💡 Your profile is stored on the Movement blockchain and cannot be changed once created.
                    </p>
                </div>
            </div>
        </div>
    );
}
export default ProfileRegistrationModal;
