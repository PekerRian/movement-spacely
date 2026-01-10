import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { MODULES, NETWORK_CONFIG } from '../constants/contracts';
import { getTopProfilesFromIndexer } from '../services/indexerService';
import './Community.css';

interface CommunityProps {
    walletConnected: boolean;
}

interface ChatMessage {
    sender: string;
    sender_username: string;
    content: string;
    is_anonymous: boolean;
    timestamp: string;
}

function Community({ walletConnected }: CommunityProps) {
    const { signAndSubmitTransaction, account } = useWallet();
    const [chatInput, setChatInput] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatError, setChatError] = useState('');
    const [globalChatInitialized, setGlobalChatInitialized] = useState(true); // Default true to hide initially
    const [isCheckingGlobalChat, setIsCheckingGlobalChat] = useState(false);

    // Cache for profile pictures - key: address, value: pfp URL
    const [profilePictures, setProfilePictures] = useState<Record<string, string>>({});

    const [leaderboardFilter, setLeaderboardFilter] = useState<'received' | 'sent' | 'balance'>('received');
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

    const [leaderboard, setLeaderboard] = useState<any[]>([
        { rank: 1, username: 'Loading...', avatar: '⏳', score: 0, received: 0, sent: 0, balance: 0 },
        { rank: 2, username: 'Loading...', avatar: '⏳', score: 0, received: 0, sent: 0, balance: 0 },
        { rank: 3, username: 'Loading...', avatar: '⏳', score: 0, received: 0, sent: 0, balance: 0 }
    ]);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);


    // Fetch messages from blockchain (via REST view)
    const fetchMessages = async () => {
        try {
            const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    function: MODULES.CHAT.GET_RECENT_MESSAGES,
                    type_arguments: [],
                    arguments: ['50'], // Get last 50 messages
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const result = await response.json();

            if (result && Array.isArray(result) && result.length > 0) {
                const raw = result[0];

                // Handle both array and object formats
                let messages: ChatMessage[] = [];

                if (Array.isArray(raw)) {
                    // If raw is an array of arrays (vector of structs as arrays)
                    messages = raw.map((m: any) => {
                        // Check if m is an array or object
                        let sender, content, timestamp, is_anonymous, username;

                        if (Array.isArray(m)) {
                            // Array format: [sender, content, timestamp, is_anonymous, username]
                            [sender, content, timestamp, is_anonymous, username] = m;
                        } else if (typeof m === 'object' && m !== null) {
                            // Object format with explicit fields
                            sender = m.sender;
                            content = m.content;
                            timestamp = m.timestamp;
                            is_anonymous = m.is_anonymous;
                            username = m.username;
                        } else {
                            console.warn('Unexpected message format:', m);
                            return null;
                        }

                        return {
                            sender,
                            sender_username: username,
                            content,
                            is_anonymous: Boolean(is_anonymous),
                            timestamp: timestamp?.toString() || '0'
                        } as ChatMessage;
                    }).filter((msg): msg is ChatMessage => msg !== null);
                }

                setMessages(messages.reverse()); // Reverse to show newest last

                // Fetch profile pictures for all non-anonymous senders
                const senderAddresses = messages
                    .filter(msg => !msg.is_anonymous)
                    .map(msg => msg.sender);

                if (senderAddresses.length > 0) {
                    fetchProfilePicturesForSenders(senderAddresses);
                }
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Fetch profile pictures for message senders
    const fetchProfilePicturesForSenders = async (senderAddresses: string[]) => {
        const uniqueAddresses = [...new Set(senderAddresses)];

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
                    if (result && result.length >= 3) {
                        let pfp = result[2]; // pfp is the 3rd item: (username, twitter, pfp, ...)
                        if (pfp) {
                            if (typeof pfp === 'string' && pfp.includes('pbs.twimg.com')) {
                                pfp = pfp.replace('_normal', '_400x400').replace('_bigger', '_400x400').replace('_mini', '_400x400');
                            }
                            setProfilePictures(prev => ({ ...prev, [address]: pfp }));
                        }
                    }
                }
            } catch (err) {
                console.error(`Error fetching pfp for ${address}:`, err);
            }
        }
    };


    // Check if global chat has been initialized
    const checkGlobalChatInitialized = async () => {
        setIsCheckingGlobalChat(true);
        try {
            // Try to fetch message count - if it succeeds, global chat is initialized
            const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    function: MODULES.CHAT.GET_MESSAGE_COUNT,
                    type_arguments: [],
                    arguments: [],
                }),
            });

            if (response.ok) {
                // If we get a successful response, global chat is initialized
                setGlobalChatInitialized(true);
            } else {
                // If it fails, global chat hasn't been initialized
                setGlobalChatInitialized(false);
            }
        } catch (err) {
            console.error('Global chat check error:', err);
            // Assume it's initialized to avoid blocking the UI
            setGlobalChatInitialized(true);
        } finally {
            setIsCheckingGlobalChat(false);
        }
    };

    useEffect(() => {
        // Always fetch messages, regardless of wallet connection
        checkGlobalChatInitialized();
        fetchMessages();
        fetchGlobalLeaderboard();

        // Refresh data periodically
        const interval = setInterval(() => {
            fetchMessages();
            fetchGlobalLeaderboard();
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchGlobalLeaderboard = async () => {
        if (isLeaderboardLoading) return;
        setIsLeaderboardLoading(true);
        try {
            let rawEntries: any[] = [];

            // 1. Try to get data directly from the new on-chain leaderboard function
            try {
                const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        function: MODULES.UPS.GET_LEADERBOARD,
                        type_arguments: [],
                        arguments: [],
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const entries = Array.isArray(data[0]) ? data[0] : [];
                    if (entries.length > 0) {
                        rawEntries = entries.map((e: any) => {
                            if (typeof e === 'object' && e.user) {
                                return {
                                    address: e.user,
                                    received: Number(e.received || 0),
                                    sent: Number(e.sent || 0),
                                    balance: Number(e.balance || 0),
                                    total_claimed: Number(e.total_claimed || 0)
                                };
                            } else if (Array.isArray(e)) {
                                // Positional fields: [user, balance, sent, received, total_claimed]
                                return {
                                    address: e[0],
                                    balance: Number(e[1] || 0),
                                    sent: Number(e[2] || 0),
                                    received: Number(e[3] || 0),
                                    total_claimed: Number(e[4] || 0)
                                };
                            }
                            return null;
                        }).filter(Boolean);
                    }
                }
            } catch (err) {
                console.warn('On-chain leaderboard fetch failed:', err);
            }

            // 2. Fallback to Indexer if on-chain failed or returned nothing
            if (rawEntries.length === 0) {
                try {
                    const topProfiles = await getTopProfilesFromIndexer(20);
                    if (topProfiles && topProfiles.length > 0) {
                        rawEntries = topProfiles.map(p => ({
                            address: p.address,
                            received: 0, // Will be fetched below
                            sent: 0,
                            balance: 0
                        }));
                    }
                } catch (err) {
                    console.warn('Indexer failed');
                }
            }

            // 3. Last Fallback: Discovery via Chat Messages
            if (rawEntries.length === 0 && messages.length > 0) {
                const addrs = Array.from(new Set(
                    messages
                        .filter(m => !m.is_anonymous && m.sender)
                        .map(m => m.sender)
                )).slice(0, 15);
                rawEntries = addrs.map(a => ({ address: a, received: 0, sent: 0, balance: 0 }));
            }

            // Always add the current user if connected and not already in rawEntries
            if (account?.address && !rawEntries.some(entry => entry.address === account.address.toString())) {
                rawEntries.push({ address: account.address.toString(), received: 0, sent: 0, balance: 0 });
            }

            if (rawEntries.length === 0) {
                setIsLeaderboardLoading(false);
                return;
            }

            // Sort and slice the top candidates for profile resolution
            // We sort by the current active filter initially
            const topCandidates = rawEntries
                .sort((a, b) => (b[leaderboardFilter] || 0) - (a[leaderboardFilter] || 0))
                .slice(0, 15);

            // Fetch missing profile data for the top candidates
            const detailedLeaderboard = await Promise.all(topCandidates.map(async (entry) => {
                const address = entry.address;
                try {
                    // Parallel profile and optional re-fetch of received (if on-chain failed to provide it)
                    const promises: Promise<any>[] = [
                        fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                function: MODULES.PROFILE.GET_FULL_PROFILE,
                                type_arguments: [],
                                arguments: [address],
                            }),
                        })
                    ];

                    // If received is 0 (fallback cases), fetch it specifically
                    if (entry.received === 0) {
                        promises.push(
                            fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    function: MODULES.UPS.GET_UPS_RECEIVED,
                                    type_arguments: [],
                                    arguments: [address],
                                }),
                            })
                        );
                    }

                    const responses = await Promise.all(promises);
                    const profileRes = responses[0];
                    const receivedUpdateRes = responses[1]; // Will be undefined if not fetched

                    let username = 'Unknown';
                    let rawPfp = '';

                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        const profile = profileData[0];
                        if (profile) {
                            if (typeof profile === 'object' && profile.username) {
                                username = profile.username;
                                rawPfp = profile.pfp;
                            } else if (Array.isArray(profile)) {
                                username = profile[1] || 'Unknown';
                                rawPfp = profile[3] || '';
                            }
                        }
                    } else {
                        const msg = messages.find(m => m.sender === address);
                        if (msg) username = msg.sender_username;
                    }

                    if (receivedUpdateRes && receivedUpdateRes.ok) {
                        const res = await receivedUpdateRes.json();
                        entry.received = Number(res[0] || 0);
                    }

                    let pfp = rawPfp;
                    if (pfp && pfp.includes('pbs.twimg.com')) {
                        pfp = pfp.replace('_normal', '_400x400').replace('_bigger', '_400x400').replace('_mini', '_400x400');
                    }

                    return {
                        ...entry,
                        username: username,
                        avatar: pfp || username.charAt(0).toUpperCase(),
                        isPfp: !!pfp
                    };
                } catch (err) {
                    return { ...entry, username: 'Unknown', avatar: '?', isPfp: false };
                }
            }));

            // Filter out failures and sort by score
            const sorted = detailedLeaderboard
                .filter(u => u !== null)
                .sort((a, b) => (b[leaderboardFilter] || 0) - (a[leaderboardFilter] || 0))
                .slice(0, 10)
                .map((u, index) => ({
                    ...u,
                    rank: index + 1,
                    score: u[leaderboardFilter] || 0
                }));

            setLeaderboard(sorted);
            setLeaderboardData(detailedLeaderboard); // Store full data for fast switching
        } catch (err) {
            console.error('Error updating leaderboard:', err);
        } finally {
            setIsLeaderboardLoading(false);
        }
    };

    const handleSendMessage = async () => {
        setChatError('');
        const content = chatInput.trim();

        // Client-side validations
        if (!content) {
            setChatError('Please enter a message');
            return;
        }

        if (content.length > 500) {
            setChatError('Message too long (max 500 characters)');
            return;
        }

        if (!walletConnected || !account) {
            setChatError('Please connect your wallet to chat');
            return;
        }

        setIsLoading(true);
        try {
            const functionName = isAnonymous ? MODULES.CHAT.POST_ANONYMOUS : MODULES.CHAT.POST_MESSAGE;

            await signAndSubmitTransaction({
                data: {
                    function: functionName,
                    typeArguments: [],
                    functionArguments: [content]
                }
            });

            setChatInput('');
            // Refresh messages after sending
            setTimeout(fetchMessages, 2000);
        } catch (error: any) {
            console.error('Error sending message:', error);
            const errorMessage = error?.message || 'Unknown error';

            // Map common Move abort codes to user-friendly messages
            if (errorMessage.includes('E_NO_PROFILE')) {
                // Could be either no profile or global chat not initialized
                if (!isAnonymous) {
                    setChatError('Transaction simulation failed: You need a profile to post public messages.');
                } else {
                    setChatError('Global chat may not be initialized. Please try again or contact an admin.');
                    setGlobalChatInitialized(false);
                }
            } else if (errorMessage.includes('E_EMPTY_MESSAGE')) {
                setChatError('Transaction simulation failed: Message cannot be empty.');
            } else if (errorMessage.includes('E_EMPTY_MESSAGE')) {
                setChatError('Transaction simulation failed: Message cannot be empty.');
            } else if (errorMessage.includes('E_MESSAGE_TOO_LONG')) {
                setChatError('Transaction simulation failed: Message exceeds maximum length.');
            } else {
                setChatError(`Transaction simulation failed: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="community-page page-enter">
            <div className="page-header">
                <h1 className="page-title">Community Hub</h1>
                <p className="page-subtitle">Connect, compete, and collaborate</p>
            </div>
            <div className="community-layout">
                <div className="leaderboard-section card">
                    <div className="section-header">
                        <h2><img src="/king.png" alt="King" className="crown-icon" /> Global Rankings</h2>
                        <select
                            className="leaderboard-filter"
                            value={leaderboardFilter}
                            onChange={(e) => {
                                const newFilter = e.target.value as any;
                                setLeaderboardFilter(newFilter);
                                // Local sort
                                const sorted = [...leaderboardData]
                                    .sort((a, b) => (b[newFilter] || 0) - (a[newFilter] || 0))
                                    .slice(0, 10)
                                    .map((u, index) => ({
                                        ...u,
                                        rank: index + 1,
                                        score: u[newFilter] || 0
                                    }));
                                setLeaderboard(sorted);
                            }}
                        >
                            <option value="received">Stars Received</option>
                            <option value="balance">Stars Balance</option>
                            <option value="sent">Stars Sent</option>
                        </select>
                    </div>
                    <div className="leaderboard-list">
                        {isLeaderboardLoading && leaderboard[0].username === 'Loading...' ? (
                            <div className="leaderboard-loading">
                                <div className="loader"></div>
                                <p>Syncing On-Chain Data...</p>
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="no-data">No users found yet. Start the journey!</div>
                        ) : leaderboard.map(user => (
                            <div key={user.address || user.rank} className={`leaderboard-item rank-${user.rank}`}>
                                <div className="rank-badge">{user.rank}</div>
                                <div className="user-info">
                                    <div className="user-avatar">
                                        {user.isPfp ? (
                                            <img src={user.avatar} alt={user.username} className="avatar-img" />
                                        ) : (
                                            user.avatar
                                        )}
                                    </div>
                                    <div className="user-details">
                                        <div className="user-name">{user.username}</div>
                                        <div className="user-stats">
                                            {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
                                        </div>
                                    </div>
                                </div>
                                <div className="user-score">
                                    <span className="score-value">{user.score.toLocaleString()}</span>
                                    <span className="score-label">
                                        {leaderboardFilter === 'received' ? 'Stars Received' :
                                            leaderboardFilter === 'sent' ? 'Stars Sent' : 'Balance'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="chat-section card">
                    <div className="section-header">
                        <h2>💬 Freedom Wall</h2>
                    </div>
                    {!globalChatInitialized && (
                        <div className="initialization-alert">
                            <p>⚠️ Public chat needs to be initialized first.</p>
                            <button
                                className="init-chat-btn"
                                onClick={async () => {
                                    try {
                                        const payload = {
                                            data: {
                                                function: MODULES.CHAT.INITIALIZE_GLOBAL_CHAT,
                                                typeArguments: [],
                                                functionArguments: []
                                            }
                                        };
                                        await signAndSubmitTransaction(payload);
                                        setGlobalChatInitialized(true);
                                        alert('✅ Global chat initialized! You can now post messages.');
                                    } catch (err) {
                                        console.error('Error:', err);
                                        alert('Failed to initialize global chat. Please try again.');
                                    }
                                }}
                                disabled={isCheckingGlobalChat}
                            >
                                <span className="btn-icon">🚀</span>
                                {isCheckingGlobalChat ? 'Initializing...' : 'Initialize Chat'}
                            </button>
                        </div>
                    )}
                    <div className="chat-messages">
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const messageTime = new Date(parseInt(msg.timestamp) * 1000);
                                const now = new Date();
                                const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
                                const timeAgo = diffMinutes < 1 ? 'Just now' :
                                    diffMinutes < 60 ? `${diffMinutes}m ago` :
                                        diffMinutes < 1440 ? `${Math.floor(diffMinutes / 60)}h ago` :
                                            `${Math.floor(diffMinutes / 1440)}d ago`;

                                const username = msg.is_anonymous ? 'Anonymous' : msg.sender_username;

                                // Get profile picture for this sender
                                const pfp = !msg.is_anonymous && msg.sender ? profilePictures[msg.sender] : null;

                                // Fallback to first letter if no pfp
                                const defaultAvatar = msg.is_anonymous ? '👻' : (username ? username.charAt(0).toUpperCase() : '?');

                                return (
                                    <div key={index} className="chat-message">
                                        <div className="message-avatar">
                                            {pfp ? (
                                                <img src={pfp} alt={username} className="avatar-img" />
                                            ) : (
                                                <span className="avatar-letter">{defaultAvatar}</span>
                                            )}
                                        </div>
                                        <div className="message-content">
                                            <div className="message-header">
                                                <span className="message-author">{username}</span>
                                                <span className="message-time">{timeAgo}</span>
                                            </div>
                                            <div className="message-text">{msg.content}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="chat-input-container">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type your message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                            disabled={isLoading}
                        />
                        <button className="send-btn" onClick={handleSendMessage} disabled={isLoading || !chatInput.trim()}>
                            <span>{isLoading ? '⏳' : 'Send'}</span>
                        </button>
                        <div className="chat-error" role="alert" aria-live="polite">{chatError}</div>
                        <label className="anonymous-toggle">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                disabled={isLoading}
                            />
                            <span>Anonymous</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Community;
