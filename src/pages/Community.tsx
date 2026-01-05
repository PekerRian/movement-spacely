import { useState } from 'react';
import './Community.css';
interface CommunityProps {
    walletConnected: boolean;
}
function Community({ walletConnected }: CommunityProps) {
    const [chatInput, setChatInput] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const leaderboard = [
        { rank: 1, username: 'SpaceExplorer', avatar: '🌟', score: 12500, streak: 15 },
        { rank: 2, username: 'CosmicTrader', avatar: '⚡', score: 10800, streak: 12 },
        { rank: 3, username: 'BlockchainPro', avatar: '🚀', score: 9200, streak: 10 }
    ];
    const [messages, setMessages] = useState([
        {
            id: 1,
            author: 'SpaceExplorer',
            avatar: '🌟',
            text: 'Welcome to Spacely! Excited to be part of this community 🚀',
            time: '2m ago',
            anonymous: false
        },
        {
            id: 2,
            author: 'CosmicTrader',
            avatar: '⚡',
            text: 'Just claimed my daily UPS! Don\'t forget to keep your streak going everyone!',
            time: '5m ago',
            anonymous: false
        },
        {
            id: 3,
            author: 'Anonymous',
            avatar: '👻',
            text: 'The event calendar feature is amazing! Already planning my first event.',
            time: '8m ago',
            anonymous: true
        }
    ]);
    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        if (!walletConnected) {
            alert('Please connect your wallet to chat');
            return;
        }
        const newMessage = {
            id: messages.length + 1,
            author: isAnonymous ? 'Anonymous' : 'You',
            avatar: isAnonymous ? '👻' : '⚡',
            text: chatInput,
            time: 'Just now',
            anonymous: isAnonymous
        };
        setMessages([...messages, newMessage]);
        setChatInput('');
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
                        <h2>🏆 UPS Leaderboard</h2>
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
                        <h2>💬 Public Chat</h2>
                        <div className="chat-stats">
                            <span>42 online</span>
                        </div>
                    </div>
                    <div className="chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className="chat-message">
                                <div className="message-avatar">{msg.avatar}</div>
                                <div className="message-content">
                                    <div className="message-header">
                                        <span className="message-author">{msg.author}</span>
                                        <span className="message-time">{msg.time}</span>
                                    </div>
                                    <div className="message-text">{msg.text}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="chat-input-container">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type your message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button className="send-btn" onClick={handleSendMessage}>
                            <span>Send</span>
                        </button>
                        <label className="anonymous-toggle">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
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
