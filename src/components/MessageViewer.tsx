import { useState, useEffect } from 'react';
import { MODULES, NETWORK_CONFIG } from '../constants/contracts';
import './MessageViewer.css';

interface Message {
    sender: string;
    sender_username: string;
    recipient: string;
    content: string;
    timestamp: number;
    id?: string;
}

interface MessageViewerProps {
    isOpen: boolean;
    contact: {
        address: string;
        username?: string;
    } | null;
    currentUserAddress: string | null;
    onClose: () => void;
    onSendMessage?: (recipientAddress: string, message: string) => Promise<void>;
    isSending?: boolean;
}

function MessageViewer({
    isOpen,
    contact,
    currentUserAddress,
    onClose,
    onSendMessage,
    isSending = false
}: MessageViewerProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [replyMessage, setReplyMessage] = useState('');

    useEffect(() => {
        const fetchMessages = async () => {
            if (!isOpen || !contact || !currentUserAddress) return;

            setIsLoading(true);
            setError('');

            try {
                console.log('Fetching messages between:', {
                    current: currentUserAddress,
                    contact: contact.address
                });

                // Use view function to get direct messages
                const response = await fetch(`${NETWORK_CONFIG.REST_URL}/view`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        function: MODULES.CHAT.GET_CONVERSATION,
                        type_arguments: [],
                        arguments: [currentUserAddress, contact.address],
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('GET_CONVERSATION Response:', result);

                    if (result && Array.isArray(result) && result.length > 0) {
                        // The response is an array of messages
                        const messageData = result[0];
                        
                        if (Array.isArray(messageData)) {
                            // Sort messages by timestamp (oldest first)
                            const sorted = messageData.sort((a: any, b: any) => 
                                parseInt(a.timestamp) - parseInt(b.timestamp)
                            );
                            setMessages(sorted);
                            console.log('Fetched messages:', sorted);
                        } else {
                            setMessages([]);
                        }
                    } else {
                        setMessages([]);
                    }
                } else {
                    console.error('Failed to fetch messages:', response.status);
                    setError('Failed to load messages');
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
                setError('Failed to load messages');
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchMessages();
        }
    }, [isOpen, contact, currentUserAddress]);

    if (!isOpen || !contact) return null;

    const formatTimestamp = (timestamp: number) => {
        try {
            const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
            return date.toLocaleString();
        } catch {
            return 'Invalid date';
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="modal active" onClick={onClose}>
            <div className="modal-content message-viewer-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="mv-header-info">
                        <div className="mv-avatar">
                            {contact.username ? contact.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <h2>Messages</h2>
                            <p className="mv-contact">
                                {contact.username || 'Unknown User'} • {formatAddress(contact.address)}
                            </p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="messages-container">
                    {isLoading ? (
                        <div className="messages-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading messages...</p>
                        </div>
                    ) : error ? (
                        <div className="messages-error">
                            <p className="error-text">⚠️ {error}</p>
                            <p className="error-hint">Make sure you have sent/received messages with this contact</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="messages-empty">
                            <div className="empty-icon">💬</div>
                            <p>No messages yet</p>
                            <p className="empty-hint">Send a message to start a conversation</p>
                        </div>
                    ) : (
                        <div className="messages-list">
                            {messages.map((msg, index) => {
                                const isSender = msg.sender.toLowerCase() === currentUserAddress?.toLowerCase();
                                return (
                                    <div
                                        key={msg.id || index}
                                        className={`message-bubble ${isSender ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-content">
                                            {msg.content}
                                        </div>
                                        <div className="message-meta">
                                            <span className="message-sender">
                                                {isSender ? 'You' : (msg.sender_username || formatAddress(msg.sender))}
                                            </span>
                                            <span className="message-time">
                                                {formatTimestamp(msg.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <div className="reply-input-group">
                        <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Type your reply..."
                            rows={3}
                            disabled={isSending}
                            maxLength={500}
                            className="reply-input"
                        />
                        <button
                            type="button"
                            className="primary-btn"
                            onClick={async () => {
                                if (replyMessage.trim() && onSendMessage && contact) {
                                    await onSendMessage(contact.address, replyMessage);
                                    setReplyMessage('');
                                }
                            }}
                            disabled={isSending || !replyMessage.trim()}
                        >
                            {isSending ? (
                                <>
                                    <span className="spinner"></span>
                                    <span className="send-text">Sending...</span>
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">📤</span>
                                    <span className="send-text">Send</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MessageViewer;
