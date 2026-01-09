import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { MODULES, NETWORK_CONFIG } from '../constants/contracts';
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

    const leaderboard = [
        { rank: 1, username: 'SpaceExplorer', avatar: '🌟', score: 12500, streak: 15 },
        { rank: 2, username: 'CosmicTrader', avatar: '⚡', score: 10800, streak: 12 },
        { rank: 3, username: 'BlockchainPro', avatar: '🚀', score: 9200, streak: 10 }
    ];

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
        // Refresh messages every 10 seconds
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, []);

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
                        <h2><img src="/king.png" alt="King" className="crown-icon" /> Top Speakers</h2>
                        <select className="leaderboard-filter">
                            <option>All Time</option>
                            <option>This Week</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    <div className="leaderboard-list">
                        {leaderboard.map(user => (
                            <div key={user.rank} className={`leaderboard-item rank-${user.rank}`}>
                                <div className="rank-badge">{user.rank}</div>
                                <div className="user-info">
                                    <div className="user-avatar">{user.avatar}</div>
                                    <div className="user-details">
                                        <div className="user-name">{user.username}</div>
                                        <div className="user-stats">{user.streak} day streak</div>
                                    </div>
                                </div>
                                <div className="user-score">{user.score.toLocaleString()} UPS</div>
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
