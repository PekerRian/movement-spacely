import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { MODULES, NETWORK_CONFIG, MODULE_ADDRESS } from '../constants/contracts';
import AddContactModal from '../components/AddContactModal';
import DirectMessageModal from '../components/DirectMessageModal';
import MessageViewer from '../components/MessageViewer';
import SendModal from '../components/SendModal';
import SuccessModal from '../components/SuccessModal';
import './Profile.css';

interface ProfileProps {
    walletConnected: boolean;
    walletAddress: string | null;
}



interface ProfileData {
    username: string;
    twitter: string;
    pfp: string;
    sent: number;
    received: number;
    balance: number;
    stars_sent: number;
    stars_received: number;
    status: string;
}

function Profile({ walletConnected, walletAddress }: ProfileProps) {
    const { account } = useWallet();
    const [activeTab, setActiveTab] = useState<'contacts' | 'messages' | 'admin'>('contacts');
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [adminRecipient, setAdminRecipient] = useState('');
    const [adminAmount, setAdminAmount] = useState('');
    const [isAdminSending, setIsAdminSending] = useState(false);
    const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!account?.address) {
                setProfile(null);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const [profileResponse, upsInfoResponse] = await Promise.all([
                    fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            function: MODULES.PROFILE.GET_PROFILE,
                            type_arguments: [],
                            arguments: [account.address.toString()],
                        }),
                    }),
                    fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            function: MODULES.UPS.GET_FULL_ACCOUNT_INFO,
                            type_arguments: [],
                            arguments: [account.address.toString()],
                        }),
                    })
                ]);

                if (!profileResponse.ok) {
                    throw new Error('Profile not found');
                }

                const result = await profileResponse.json();

                // Parse UPS data safely from full info
                let balance = 0;
                let starsSent = 0;
                let starsReceived = 0;

                if (upsInfoResponse.ok) {
                    const upsInfoResult = await upsInfoResponse.json();
                    if (Array.isArray(upsInfoResult) && upsInfoResult.length >= 6) {
                        // Info order: [balance, streak, last_claim, sent, received, total_claimed]
                        balance = Number(upsInfoResult[0]);
                        starsSent = Number(upsInfoResult[3]);
                        starsReceived = Number(upsInfoResult[4]);
                    }
                }

                const [username, twitter, rawPfp, sentAmount, receivedAmount, statusCode] = result;
                let pfp = rawPfp as string;
                if (pfp && pfp.includes('pbs.twimg.com')) {
                    pfp = pfp.replace('_normal', '_400x400').replace('_bigger', '_400x400').replace('_mini', '_400x400');
                }

                setProfile({
                    username: username as string,
                    twitter: twitter as string,
                    pfp: pfp,
                    sent: Number(sentAmount),
                    received: Number(receivedAmount),
                    balance: balance,
                    stars_sent: starsSent,
                    stars_received: starsReceived,
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

    // Contact management
    interface Contact {
        address: string;
        username?: string;
        pfp?: string; // Profile picture URL
        addedAt: number;
    }

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [showAddContactModal, setShowAddContactModal] = useState(false);

    // Cache for profile pictures - key: address, value: pfp URL
    const [profilePictures, setProfilePictures] = useState<Record<string, string>>({});

    // Load contacts from localStorage on mount
    useEffect(() => {
        if (walletAddress) {
            const savedContacts = localStorage.getItem(`spacely_contacts_${walletAddress}`);
            if (savedContacts) {
                try {
                    setContacts(JSON.parse(savedContacts));
                } catch (err) {
                    console.error('Error loading contacts:', err);
                }
            }
        }
    }, [walletAddress]);

    // Save contacts to localStorage whenever they change
    useEffect(() => {
        if (walletAddress && contacts.length > 0) {
            localStorage.setItem(`spacely_contacts_${walletAddress}`, JSON.stringify(contacts));
        }
    }, [contacts, walletAddress]);

    const handleAddContactClick = () => {
        if (!walletConnected) {
            alert('Please connect your wallet');
            return;
        }
        setShowAddContactModal(true);
    };

    const handleAddContact = async (address: string) => {
        // Validate address format
        const cleanAddress = address.trim().toLowerCase();

        // Check if already added
        if (contacts.some(c => c.address.toLowerCase() === cleanAddress)) {
            alert('⚠️ This contact is already in your list!');
            setShowAddContactModal(false);
            return;
        }

        // Check if trying to add own address
        if (walletAddress && cleanAddress === walletAddress.toLowerCase()) {
            alert('❌ You cannot add yourself as a contact!');
            setShowAddContactModal(false);
            return;
        }

        setIsAddingContact(true);

        try {
            // Try to fetch the contact's profile from blockchain
            const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    function: MODULES.PROFILE.GET_PROFILE,
                    type_arguments: [],
                    arguments: [cleanAddress],
                }),
            });

            let username = undefined;
            let pfp = undefined;
            if (response.ok) {
                const result = await response.json();
                if (result && result[0]) {
                    username = result[0] as string;
                }
                if (result && result[2]) {
                    pfp = result[2] as string; // pfp is 3rd item in tuple
                    if (pfp && pfp.includes('pbs.twimg.com')) {
                        pfp = pfp.replace('_normal', '_400x400').replace('_bigger', '_400x400').replace('_mini', '_400x400');
                    }
                    // Cache the pfp
                    setProfilePictures(prev => ({ ...prev, [cleanAddress]: pfp! }));
                }
            }

            // Add contact
            const newContact: Contact = {
                address: cleanAddress,
                username,
                pfp,
                addedAt: Date.now()
            };

            setContacts(prev => [...prev, newContact]);
            setShowAddContactModal(false);
            alert(`✅ Contact added successfully!${username ? ` (${username})` : ''}`);
        } catch (err) {
            console.error('Error adding contact:', err);
            // Still add the contact even if profile fetch fails
            const newContact: Contact = {
                address: cleanAddress,
                addedAt: Date.now()
            };
            setContacts(prev => [...prev, newContact]);
            setShowAddContactModal(false);
            alert('✅ Contact added (profile not found on blockchain)');
        } finally {
            setIsAddingContact(false);
        }
    };

    const handleRemoveContact = (address: string) => {
        if (confirm('Are you sure you want to remove this contact?')) {
            setContacts(prev => prev.filter(c => c.address !== address));
            if (walletAddress) {
                const remaining = contacts.filter(c => c.address !== address);
                if (remaining.length === 0) {
                    localStorage.removeItem(`spacely_contacts_${walletAddress}`);
                }
            }
        }
    };

    // Direct messaging
    const { signAndSubmitTransaction } = useWallet();
    const [showDMModal, setShowDMModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isSendingDM, setIsSendingDM] = useState(false);
    const [showMessageViewer, setShowMessageViewer] = useState(false);

    // Send Money/Stars State
    const [sendModalOpen, setSendModalOpen] = useState(false);
    const [sendType, setSendType] = useState<'move' | 'stars'>('move');
    const [recipientInfo, setRecipientInfo] = useState<{ name: string, address: string } | null>(null);

    const openSendModal = (contact: Contact, type: 'move' | 'stars') => {
        setRecipientInfo({ name: contact.username || 'Unknown', address: contact.address });
        setSendType(type);
        setSendModalOpen(true);
    };

    const handleSendTransfer = async (amount: number) => {
        if (!recipientInfo) return;

        try {
            if (sendType === 'move') {
                // 1 MOVE = 100,000,000 Octas
                const amountOctas = Math.floor(amount * 100_000_000);
                await signAndSubmitTransaction({
                    data: {
                        function: MODULES.PROFILE.TRANSFER_TOKENS,
                        typeArguments: [],
                        functionArguments: [recipientInfo.address, amountOctas]
                    }
                });
                alert(`Successfully sent ${amount} MOVE to ${recipientInfo.name}!`);
            } else {
                // Send Stars
                const amountInt = Math.floor(amount);
                await signAndSubmitTransaction({
                    data: {
                        function: MODULES.UPS.SEND_UPS,
                        typeArguments: [],
                        functionArguments: [recipientInfo.address, amountInt]
                    }
                });
                alert(`Successfully sent ${amountInt} Stars to ${recipientInfo.name}!`);
            }
        } catch (e: any) {
            console.error("Transfer failed", e);
            throw e;
        }
    };

    const handleMessageContact = (contact: Contact) => {
        setSelectedContact(contact);
        setShowDMModal(true);
    };

    const handleViewMessages = (contact: Contact) => {
        setSelectedContact(contact);
        setShowMessageViewer(true);
    };

    const handleSendDirectMessage = async (recipientAddress: string, message: string) => {
        if (!account?.address) {
            alert('⚠️ Please connect your wallet');
            return;
        }

        setIsSendingDM(true);

        try {
            const payload = {
                data: {
                    function: MODULES.CHAT.SEND_DIRECT_MESSAGE,
                    typeArguments: [],
                    functionArguments: [
                        recipientAddress,
                        message
                    ]
                }
            };

            const response: any = await signAndSubmitTransaction(payload);

            if (response && (response.hash || response.transactionHash)) {
                console.log('Message sent! Hash:', response.hash || response.transactionHash);
                setShowDMModal(false);
                setSelectedContact(null);
                alert('✅ Message sent successfully!');
            } else {
                throw new Error('Transaction failed');
            }
        } catch (err: any) {
            console.error('Error sending message:', err);
            let errorMessage = 'Failed to send message';

            if (err.message?.includes('E_NO_PROFILE')) {
                errorMessage = '❌ You need to create a profile first';
            } else if (err.message?.includes('E_RECIPIENT_NO_PROFILE')) {
                errorMessage = '❌ Recipient does not have a profile';
            } else if (err.message?.includes('rejected') || err.message?.includes('User has rejected')) {
                errorMessage = '❌ Transaction was rejected. Please try again.';
            } else if (err.code === 4001) {
                errorMessage = '❌ Transaction was rejected by your wallet';
            }

            alert(errorMessage);
        } finally {
            setIsSendingDM(false);
        }
    };

    // Check if user has inbox initialized
    const [hasInbox, setHasInbox] = useState<boolean>(false); // Default false to show button initially
    const [isCheckingInbox, setIsCheckingInbox] = useState(false);

    const checkInboxInitialized = async () => {
        if (!account?.address) return;

        setIsCheckingInbox(true);
        try {
            const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    function: MODULES.CHAT.HAS_INBOX,
                    type_arguments: [],
                    arguments: [account.address.toString()],
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const inboxExists = result && result[0] === true;
                console.log('Inbox check result:', inboxExists);
                setHasInbox(inboxExists);
            } else {
                console.error('Inbox check failed:', response.status);
            }
        } catch (err) {
            console.error('Error checking inbox:', err);
        } finally {
            setIsCheckingInbox(false);
        }
    };

    // Conversations management
    interface Conversation {
        other_party: string;
        other_party_username: string;
        last_message_timestamp: number;
        unread_count: number;
    }

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);

    // Fetch profile pictures for given addresses
    const fetchProfilePicturesFor = async (addresses: string[]) => {
        const uniqueAddresses = [...new Set(addresses)];

        for (const address of uniqueAddresses) {
            // Skip if already cached
            if (profilePictures[address]) continue;

            try {
                const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        function: MODULES.PROFILE.GET_PROFILE,
                        type_arguments: [],
                        arguments: [address],
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result && result[2]) {
                        let pfp = result[2]; // pfp is 3rd item
                        if (pfp && typeof pfp === 'string' && pfp.includes('pbs.twimg.com')) {
                            pfp = pfp.replace('_normal', '_400x400').replace('_bigger', '_400x400').replace('_mini', '_400x400');
                        }
                        setProfilePictures(prev => ({ ...prev, [address]: pfp }));
                    }
                }
            } catch (err) {
                console.error(`Error fetching pfp for ${address}:`, err);
            }
        }
    };

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            if (!account?.address) {
                setConversations([]);
                return;
            }

            setIsLoadingConversations(true);
            try {
                const accountAddress = account.address.toString();
                console.log('Fetching conversations for account:', accountAddress);

                const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        function: MODULES.CHAT.GET_CONVERSATIONS,
                        type_arguments: [],
                        arguments: [accountAddress],
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('GET_CONVERSATIONS Response:', result);

                    if (result && Array.isArray(result) && result.length > 0) {
                        // Handle double-wrapped array: result is [[{ conversation }, ...]]
                        const conversationArray = result[0];

                        if (Array.isArray(conversationArray) && conversationArray.length > 0) {
                            // Parse conversations
                            const parsedConversations: Conversation[] = conversationArray.map((conv: any) => ({
                                other_party: conv.other_party,
                                other_party_username: conv.other_party_username,
                                last_message_timestamp: parseInt(conv.last_message_timestamp),
                                unread_count: parseInt(conv.unread_count)
                            }))
                                ;
                            console.log('Parsed conversations:', parsedConversations);
                            setConversations(parsedConversations);

                            // Fetch profile pictures for conversation participants
                            const addresses = parsedConversations.map(c => c.other_party);
                            if (addresses.length > 0) {
                                fetchProfilePicturesFor(addresses);
                            }
                        } else {
                            setConversations([]);
                        }
                    } else {
                        setConversations([]);
                    }
                } else {
                    console.error('GET_CONVERSATIONS request failed:', response.status);
                    setConversations([]);
                }
            } catch (err) {
                console.error('Error fetching conversations:', err);
                setConversations([]);
            } finally {
                setIsLoadingConversations(false);
            }
        };

        if (walletConnected && activeTab === 'messages') {
            fetchConversations();
            checkInboxInitialized(); // Check inbox status
            // Refresh every 30 seconds
            const interval = setInterval(fetchConversations, 30000);
            return () => clearInterval(interval);
        } else {
            setConversations([]);
        }
    }, [walletConnected, activeTab, account?.address]);

    const handleMarkAsRead = async (otherPartyAddress: string) => {
        if (!account?.address) return;

        try {
            const payload = {
                data: {
                    function: MODULES.CHAT.MARK_CONVERSATION_READ,
                    typeArguments: [],
                    functionArguments: [otherPartyAddress]
                }
            };

            await signAndSubmitTransaction(payload);

            // Update local state
            setConversations(prev =>
                prev.map(conv =>
                    conv.other_party === otherPartyAddress
                        ? { ...conv, unread_count: 0 }
                        : conv
                )
            );
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleGenerateAndSend = async () => {
        if (!adminRecipient || !adminAmount) {
            alert('Please provide recipient and amount');
            return;
        }

        setIsAdminSending(true);
        try {
            await signAndSubmitTransaction({
                data: {
                    function: MODULES.UPS.GENERATE_AND_SEND_UPS,
                    typeArguments: [],
                    functionArguments: [adminRecipient, Math.floor(Number(adminAmount))]
                }
            });
            setSuccessModal({
                isOpen: true,
                title: 'Stars Generated! 🌟',
                message: `Successfully generated and sent ${adminAmount} Stars to ${adminRecipient}!`
            });
            setAdminRecipient('');
            setAdminAmount('');
        } catch (err: any) {
            console.error('Admin send failed:', err);
            alert('Admin send failed: ' + (err.message || 'Unknown error'));
        } finally {
            setIsAdminSending(false);
        }
    };

    const isAdmin = account?.address?.toString() === MODULE_ADDRESS;

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
                                        <div className="stat-value">
                                            {(profile.sent / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            <span style={{ fontSize: '0.8em', marginLeft: '4px', opacity: 0.8 }}>MOVE</span>
                                        </div>
                                        <div className="stat-label">Tips Sent</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">
                                            {(profile.received / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            <span style={{ fontSize: '0.8em', marginLeft: '4px', opacity: 0.8 }}>MOVE</span>
                                        </div>
                                        <div className="stat-label">Tips Received</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{profile.balance || 0}</div>
                                        <div className="stat-label">Stars Balance</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{profile.stars_sent || 0}</div>
                                        <div className="stat-label">Stars Sent</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">{profile.stars_received || 0}</div>
                                        <div className="stat-label">Stars Received</div>
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
                        {isAdmin && (
                            <button
                                className={`profile-tab ${activeTab === 'admin' ? 'active' : ''}`}
                                onClick={() => setActiveTab('admin')}
                            >
                                Admin
                            </button>
                        )}
                    </div>

                    <div className="profile-tab-content">
                        {activeTab === 'contacts' && (
                            <div className="tab-pane active">
                                <div className="tab-header">
                                    <h3>Your Contacts</h3>
                                    <button
                                        className="secondary-btn"
                                        onClick={handleAddContactClick}
                                        disabled={isAddingContact}
                                    >
                                        <span className="btn-icon">{isAddingContact ? '⏳' : '➕'}</span>
                                        {isAddingContact ? 'Adding...' : 'Add Contact'}
                                    </button>
                                </div>
                                <div className="contacts-list">
                                    {!walletConnected ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">👥</div>
                                            <p>Connect your wallet to view contacts</p>
                                        </div>
                                    ) : contacts.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">👥</div>
                                            <p>No contacts yet. Add someone to get started!</p>
                                        </div>
                                    ) : (
                                        <div className="contact-items">
                                            {contacts.map((contact) => (
                                                <div key={contact.address} className="contact-item">
                                                    <div className="contact-info">
                                                        <div className="contact-avatar">
                                                            {contact.pfp || profilePictures[contact.address] ? (
                                                                <img
                                                                    src={contact.pfp || profilePictures[contact.address]}
                                                                    alt={contact.username}
                                                                    className="avatar-img"
                                                                />
                                                            ) : (
                                                                <span className="avatar-letter">
                                                                    {contact.username ? contact.username.charAt(0).toUpperCase() : '?'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="contact-details">
                                                            <div className="contact-name">
                                                                {contact.username || 'Unknown User'}
                                                            </div>
                                                            <div className="contact-address">
                                                                {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="contact-actions">
                                                        <button
                                                            className="message-contact-btn"
                                                            onClick={() => handleMessageContact(contact)}
                                                            title="Send message"
                                                        >
                                                            💬
                                                        </button>
                                                        <button
                                                            className="message-contact-btn"
                                                            onClick={() => openSendModal(contact, 'move')}
                                                            title="Send MOVE"
                                                        >
                                                            💸
                                                        </button>
                                                        <button
                                                            className="message-contact-btn"
                                                            onClick={() => openSendModal(contact, 'stars')}
                                                            title="Send Stars"
                                                        >
                                                            ⭐
                                                        </button>
                                                        <button
                                                            className="remove-contact-btn"
                                                            onClick={() => handleRemoveContact(contact.address)}
                                                            title="Remove contact"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'admin' && isAdmin && (
                            <div className="tab-pane active">
                                <div className="tab-header">
                                    <h3>Admin Dashboard</h3>
                                </div>
                                <div className="admin-form card" style={{
                                    padding: '2rem',
                                    marginTop: '1rem',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '16px'
                                }}>
                                    <h4 style={{ marginBottom: '1.5rem', color: '#ffb700' }}>Generate & Send Stars</h4>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Recipient Address</label>
                                        <input
                                            type="text"
                                            placeholder="0x..."
                                            value={adminRecipient}
                                            onChange={(e) => setAdminRecipient(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem',
                                                background: 'rgba(0, 0, 0, 0.2)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white'
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Amount</label>
                                        <input
                                            type="number"
                                            placeholder="100"
                                            value={adminAmount}
                                            onChange={(e) => setAdminAmount(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem',
                                                background: 'rgba(0, 0, 0, 0.2)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white'
                                            }}
                                        />
                                    </div>
                                    <button
                                        className="primary-btn"
                                        onClick={handleGenerateAndSend}
                                        disabled={isAdminSending}
                                        style={{ width: '100%' }}
                                    >
                                        {isAdminSending ? 'Sending...' : 'Generate & Send'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'messages' && (
                            <div className="tab-pane active">
                                <div className="tab-header">
                                    <h3>Private Messages</h3>
                                    {!hasInbox && (
                                        <button
                                            className="secondary-btn"
                                            onClick={async () => {
                                                try {
                                                    const payload = {
                                                        data: {
                                                            function: MODULES.CHAT.INITIALIZE_INBOX,
                                                            typeArguments: [],
                                                            functionArguments: []
                                                        }
                                                    };
                                                    await signAndSubmitTransaction(payload);
                                                    setHasInbox(true); // Update state immediately
                                                    alert('✅ Messaging initialized! You can now send and receive messages.');
                                                } catch (err) {
                                                    console.error('Error:', err);
                                                    alert('Failed to initialize. You may already have messaging enabled.');
                                                    checkInboxInitialized(); // Recheck status
                                                }
                                            }}
                                            disabled={isCheckingInbox}
                                        >
                                            <span className="btn-icon">📬</span>
                                            {isCheckingInbox ? 'Checking...' : 'Initialize Messaging'}
                                        </button>
                                    )}
                                </div>
                                <div className="conversations-list">
                                    {!walletConnected ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">💬</div>
                                            <p>Connect your wallet to view messages</p>
                                        </div>
                                    ) : isLoadingConversations ? (
                                        <div className="loading-state">
                                            <div className="loading-spinner"></div>
                                            <p>Loading conversations...</p>
                                        </div>
                                    ) : conversations.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="empty-icon">💬</div>
                                            <p>No conversations yet. Send a message to a contact!</p>
                                        </div>
                                    ) : (
                                        <div className="conversation-items">
                                            {conversations && conversations.map((conversation) => {
                                                if (!conversation || !conversation.other_party) return null;
                                                return (
                                                    <div
                                                        key={conversation.other_party}
                                                        className="conversation-item"
                                                    >
                                                        <div className="conversation-avatar">
                                                            {profilePictures[conversation.other_party] ? (
                                                                <img
                                                                    src={profilePictures[conversation.other_party]}
                                                                    alt={conversation.other_party_username}
                                                                    className="avatar-img"
                                                                />
                                                            ) : (
                                                                <span className="avatar-letter">
                                                                    {conversation.other_party_username && conversation.other_party_username.length > 0
                                                                        ? conversation.other_party_username.charAt(0).toUpperCase()
                                                                        : '?'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="conversation-details">
                                                            <div className="conversation-header">
                                                                <div className="conversation-name">
                                                                    {conversation.other_party_username || 'Unknown User'}
                                                                </div>
                                                                {conversation.unread_count > 0 && (
                                                                    <div className="unread-badge">
                                                                        {conversation.unread_count}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="conversation-meta">
                                                                <span className="conversation-address">
                                                                    {conversation.other_party.slice(0, 6)}...{conversation.other_party.slice(-4)}
                                                                </span>
                                                                <span className="conversation-time">
                                                                    {new Date(conversation.last_message_timestamp / 1000).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="message-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const contact = {
                                                                    address: conversation.other_party,
                                                                    username: conversation.other_party_username,
                                                                    addedAt: Date.now()
                                                                };
                                                                handleViewMessages(contact);
                                                            }}
                                                            title="View messages"
                                                        >
                                                            👁️
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {successModal.isOpen && (
                <SuccessModal
                    isOpen={successModal.isOpen}
                    title={successModal.title}
                    message={successModal.message}
                    onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                />
            )}

            {/* Add Contact Modal */}
            <AddContactModal
                isOpen={showAddContactModal}
                onClose={() => setShowAddContactModal(false)}
                onAddContact={handleAddContact}
                isLoading={isAddingContact}
            />

            {/* Direct Message Modal */}
            <DirectMessageModal
                isOpen={showDMModal}
                contact={selectedContact}
                onClose={() => {
                    setShowDMModal(false);
                    setSelectedContact(null);
                }}
                onSendMessage={handleSendDirectMessage}
                isSending={isSendingDM}
            />

            {/* Message Viewer */}
            <MessageViewer
                isOpen={showMessageViewer}
                contact={selectedContact}
                currentUserAddress={account?.address?.toString() || null}
                onClose={() => {
                    setShowMessageViewer(false);
                    setSelectedContact(null);
                }}
                onSendMessage={handleSendDirectMessage}
                isSending={isSendingDM}
            />
            {recipientInfo && (
                <SendModal
                    isOpen={sendModalOpen}
                    onClose={() => setSendModalOpen(false)}
                    recipientName={recipientInfo.name}
                    recipientAddress={recipientInfo.address}
                    type={sendType}
                    onSend={handleSendTransfer}
                />
            )}
        </div>
    );
}

export default Profile;
