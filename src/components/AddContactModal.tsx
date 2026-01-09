import { useState } from 'react';
import './AddContactModal.css';

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddContact: (address: string) => void;
    isLoading?: boolean;
}

function AddContactModal({ isOpen, onClose, onAddContact, isLoading = false }: AddContactModalProps) {
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!address.trim()) {
            setError('Please enter an address');
            return;
        }

        // Basic validation
        const cleanAddress = address.trim();
        if (!cleanAddress.startsWith('0x')) {
            setError('Address must start with 0x');
            return;
        }

        if (cleanAddress.length < 64 || cleanAddress.length > 66) {
            setError('Invalid address length');
            return;
        }

        onAddContact(cleanAddress);
        setAddress('');
        setError('');
    };

    const handleClose = () => {
        setAddress('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal active" onClick={handleClose}>
            <div className="modal-content add-contact-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Contact</h2>
                    <button className="modal-close" onClick={handleClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Contact Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter wallet address (0x...)"
                            disabled={isLoading}
                            autoFocus
                            className={error ? 'error' : ''}
                        />
                        {error && <span className="error-hint">{error}</span>}
                        <span className="form-hint">
                            Enter the wallet address of the person you want to add
                        </span>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">➕</span>
                                    Add Contact
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddContactModal;
