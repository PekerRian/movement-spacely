import { useEffect, useState } from 'react';
import './WelcomeBackModal.css';

interface WelcomeBackModalProps {
    isOpen: boolean;
    username: string;
    walletAddress: string;
    onClose: () => void;
}

function WelcomeBackModal({ isOpen, username, walletAddress, onClose }: WelcomeBackModalProps) {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldShow(true);
            // Auto-close after 3 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShouldShow(false);
        }
    }, [isOpen, onClose]);

    if (!isOpen && !shouldShow) return null;

    return (
        <div className={`modal ${isOpen ? 'active' : ''}`} onClick={onClose}>
            <div className="modal-content welcome-modal" onClick={(e) => e.stopPropagation()}>
                <div className="welcome-header">
                    <div className="welcome-icon">👋</div>
                    <h2>Welcome Back!</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="welcome-body">
                    <div className="user-greeting">
                        <div className="greeting-text">
                            <span className="greeting-label">Hello,</span>
                            <span className="greeting-username">{username}</span>
                        </div>
                        <div className="wallet-display">
                            <span className="wallet-label">Connected:</span>
                            <span className="wallet-value">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                        </div>
                    </div>

                    <div className="welcome-message">
                        <p>🎉 Your profile is already set up!</p>
                        <p>Ready to explore Spacely?</p>
                    </div>

                    <div className="quick-actions">
                        <div className="action-item" onClick={onClose}>
                            <span className="action-icon">📅</span>
                            <span className="action-label">View Spaces</span>
                        </div>
                        <div className="action-item" onClick={onClose}>
                            <span className="action-icon">💬</span>
                            <span className="action-label">Join Chat</span>
                        </div>
                        <div className="action-item" onClick={onClose}>
                            <span className="action-icon">👤</span>
                            <span className="action-label">My Profile</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="primary-btn full-width" onClick={onClose}>
                        Let's Go! 🚀
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WelcomeBackModal;
