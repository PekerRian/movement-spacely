import { useState } from 'react';
import './DirectMessageModal.css';

interface DirectMessageModalProps {
    isOpen: boolean;
    contact: {
        address: string;
        username?: string;
    } | null;
    onClose: () => void;
    onSendMessage: (recipientAddress: string, message: string) => void;
    isSending?: boolean;
}

function DirectMessageModal({
    isOpen,
    contact,
    onClose,
    onSendMessage,
    isSending = false
}: DirectMessageModalProps) {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }

        if (message.length > 500) {
            setError('Message is too long (max 500 characters)');
            return;
        }

        if (!contact) {
            setError('No contact selected');
            return;
        }

        onSendMessage(contact.address, message);
        setMessage('');
    };

    const handleClose = () => {
        setMessage('');
        setError('');
        onClose();
    };

    if (!isOpen || !contact) return null;

    return (
        <div className="modal active" onClick={handleClose}>
            <div className="modal-content dm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="dm-header-info">
                        <div className="dm-avatar">
                            {contact.username ? contact.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <h2>Send Message</h2>
                            <p className="dm-recipient">
                                To: <span className="recipient-name">{contact.username || 'Unknown User'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Your Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            disabled={isSending}
                            autoFocus
                            className={error ? 'error' : ''}
                            maxLength={500}
                        />
                        <div className="message-footer">
                            {error && <span className="error-hint">{error}</span>}
                            <span className="char-count">
                                {message.length}/500
                            </span>
                        </div>
                        <span className="form-hint">
                            💡 Messages are stored on the Movement blockchain
                        </span>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={isSending || !message.trim()}
                        >
                            {isSending ? (
                                <>
                                    <span className="spinner"></span>
                                    <span className="send-text">Sending...</span>
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">📤</span>
                                    <span className="send-text">Send Message</span>
                                </>
                            )}
                        </button> 
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DirectMessageModal;
