import React, { useState } from 'react';
import './SendModal.css';

interface SendModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientAddress: string;
    type: 'move' | 'stars';
    onSend: (amount: number) => Promise<void>;
}

export default function SendModal({ isOpen, onClose, recipientName, recipientAddress, type, onSend }: SendModalProps) {
    const [amount, setAmount] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        setIsSending(true);
        try {
            await onSend(Number(amount));
            onClose();
            setAmount('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="modal active" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h2>Send {type === 'move' ? 'MOVE' : 'Stars'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="send-modal-body">
                    <p style={{ marginBottom: '0.5rem' }}>Sending to: <strong>{recipientName}</strong></p>
                    <div className="address-preview">{recipientAddress}</div>

                    <form onSubmit={handleSubmit}>
                        <div className="send-form-group">
                            <label>Amount ({type === 'move' ? 'MOVE' : 'Stars'})</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step={type === 'move' ? "0.00000001" : "1"}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="secondary-btn" onClick={onClose} disabled={isSending}>Cancel</button>
                            <button type="submit" className="primary-btn" disabled={isSending}>
                                {isSending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
