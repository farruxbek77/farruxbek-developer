'use client';

import { useState } from 'react';

export default function MessageForm({ selectedCount, onSend, selectedContacts }) {
    const [message, setMessage] = useState('');
    const [showSmsModal, setShowSmsModal] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && selectedCount > 0) {
            setShowSmsModal(true);
        }
    };

    const confirmSend = () => {
        onSend(message);
        setMessage('');
        setShowSmsModal(false);
    };

    return (
        <>
            <div className="message-form">
                <h3>Tanlangan kontaktlarga xabar</h3>
                <form onSubmit={handleSubmit}>
                    <textarea
                        placeholder="Xabar matnini kiriting..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows="4"
                        required
                    />
                    <button
                        type="submit"
                        className="btn-send"
                        disabled={selectedCount === 0 || !message.trim()}
                    >
                        Xabar yuborish ({selectedCount} ta kontakt)
                    </button>
                </form>
            </div>

            {showSmsModal && (
                <div className="modal-overlay" onClick={() => setShowSmsModal(false)}>
                    <div className="modal sms-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sms-icon">SMS</div>
                        <h2>SMS yuborish</h2>
                        <p className="sms-message">
                            <span>{selectedCount}</span> ta kontaktga SMS yubormoqchimisiz?
                        </p>
                        <div className="sms-preview">
                            <strong>Xabar:</strong>
                            <p>{message}</p>
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={confirmSend} className="btn-primary">
                                Ha, yuborish
                            </button>
                            <button type="button" onClick={() => setShowSmsModal(false)} className="btn-secondary">
                                Bekor qilish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
