import { useEffect, useState } from 'react';
import './SuccessModal.css';

interface SuccessModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

function SuccessModal({ isOpen, title, message, onClose }: SuccessModalProps) {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldShow(true);
            // Auto-close after 4 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            setShouldShow(false);
        }
    }, [isOpen, onClose]);

    if (!isOpen && !shouldShow) return null;

    return (
        <div className={`modal ${isOpen ? 'active' : ''}`} onClick={onClose}>
            <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
                <div className="success-header">
                    <div className="success-icon">✨</div>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="success-body">
                    <h2 className="success-title">{title}</h2>
                    <p className="success-message">{message}</p>

                    <div className="success-stats">
                        <div className="stat-row">
                            <span>Network</span>
                            <span className="stat-value">Movement Bardock</span>
                        </div>
                        <div className="stat-row">
                            <span>Status</span>
                            <span className="stat-value success">Active</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="primary-btn full-width" onClick={onClose}>
                        Ready to Explore 🚀
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SuccessModal;
