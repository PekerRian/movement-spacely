import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import './Profile.css';

interface ProfileProps {
    walletConnected: boolean;
    walletAddress: string | null;
}

const MODULE_ADDRESS = 'a33869c482c817859d4043da2a9c264a95da932812d1c1d4de24f46a168c3917';
const APTOS_NODE_URL = 'https://fullnode.testnet.aptoslabs.com/v1';

interface ProfileData {
    username: string;
    twitter: string;
    pfp: string;
    sent: number;
    received: number;
    status: string;
}

function Profile({ walletConnected, walletAddress }: ProfileProps) {
    const { account } = useWallet();
    const [activeTab, setActiveTab] = useState<'contacts' | 'messages'>('contacts');
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!account?.address) {
                setProfile(null);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const response = await fetch(`${APTOS_NODE_URL}/view`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        function: `${MODULE_ADDRESS}::profile::get_profile_with_status`,
                        type_arguments: [],
                        arguments: [account.address.toString()],
                    }),
                });

                if (!response.ok) {
                    throw new Error('Profile not found');
                }

                const result = await response.json();

                const [username, twitter, pfp, sentAmount, receivedAmount, statusCode] = result;

                setProfile({
                    username: username as string,
                    twitter: twitter as string,
                    pfp: pfp as string,
                    sent: Number(sentAmount),
                    received: Number(receivedAmount),
                    status: Number(statusCode) === 1 ? 'Host' : 'Participant'
                });

            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Profile not found. Please create your profile first.');
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [account?.address]);

    const handleAddContact = () => {
        if (!walletConnected) {
            alert('Please connect your wallet');
            return;
        }
        const address = prompt('Enter contact address:');
        if (address) {
            console.log('Adding contact:', address);
        }
    };

    return (
        <div className="profile-page page-enter">
            <div className="page-header">
                <h1 className="page-title">Your Profile</h1>
                <p className="page-subtitle">Manage your identity and connections</p>
            </div>

            <div className="profile-layout">
                <div className="profile-info-card card">
                    <div className="profile-banner"></div>
                    <div className="profile-avatar">
                        {profile?.pfp ? (
                            <img src={profile.pfp} alt={profile.username} className="avatar-image" />
                        ) : (
                            <div className="avatar-circle">
                                <span>{profile ? profile.username.charAt(0).toUpperCase() : '?'}</span>
                            </div>
                        )}
                    </div>
                    <div className="profile-details">
                        {loading ? (
                            <>
                                <h2>Loading...</h2>
                                <p className="profile-twitter">Fetching profile data...</p>
                            </>
                        ) : error ? (
                            <>
                                <h2>No Profile Found</h2>
                                <p className="profile-twitter error-text">{error}</p>
                            </>
                        ) : profile ? (
                            <>
                                <h2>{profile.username}</h2>
                                <p className="profile-twitter">{profile.twitter}</p>
                                <div className="profile-stats">
                                    <div className="stat-item">
                                        <div className="stat-value">{profile.sent}</div>
                                        <div className="stat-label">Tokens Sent</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{profile.received}</div>
                                        <div className="stat-label">Tokens Received</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{profile.status}</div>
                                        <div className="stat-label">Status</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2>Connect Wallet</h2>
                                <p className="profile-twitter">Please connect your wallet to view your profile</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="profile-tabs-container">
                    <div className="profile-tabs">
                        <button
                            className={`profile-tab ${activeTab === 'contacts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('contacts')}
                        >
                            Contacts
                        </button>
                        <button
                            className={`profile-tab ${activeTab === 'messages' ? 'active' : ''}`}
                            onClick={() => setActiveTab('messages')}
                        >
                            Messages
                        </button>
                    </div>

                    <div className="profile-tab-content">
                        {activeTab === 'contacts' && (
                            <div className="tab-pane active">
                                <div className="tab-header">
                                    <h3>Your Contacts</h3>
                                    <button className="secondary-btn" onClick={handleAddContact}>
                                        <span className="btn-icon">➕</span> Add Contact
                                    </button>
                                </div>
                                <div className="contacts-list">
                                    {!walletConnected ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">👥</div>
                                            <p>Connect your wallet to view contacts</p>
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">👥</div>
                                            <p>No contacts yet. Add someone to get started!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div className="tab-pane active">
                                <div className="tab-header">
                                    <h3>Private Messages</h3>
                                </div>
                                <div className="conversations-list">
                                    {!walletConnected ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">💬</div>
                                            <p>Connect your wallet to view messages</p>
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">💬</div>
                                            <p>No conversations yet. Send a message to a contact!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
