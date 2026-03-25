'use client';

import { useState } from 'react';

export default function SmsModal({ contacts, message, onClose, onSend }) {
    const [selectedRecipients, setSelectedRecipients] = useState(contacts.map(c => c.id));
    const [smsMessage, setSmsMessage] = useState(message);

    const toggleRecipient = (id) => {
        if (selectedRecipients.includes(id)) {
            setSelectedRecipients(selectedRecipients.filter(rid => rid !== id));
        } else {
            setSelectedRecipients([...selectedRecipients, id]);
        }
    };

    const handleSend = () => {
        const selected = contacts.filter(c => selectedRecipients.includes(c.id));
        onSend(selected, smsMessage);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal sms-send-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">
                    <h2>SMS Yuborish</h2>
                    <button type="button" onClick={onClose} className="close-btn">×</button>
                </div>

                <div className="sms-recipients">
                    <h3>Qabul qiluvchilar ({selectedRecipients.length})</h3>
                    <div className="recipient-list">
                        {contacts.map(contact => (
                            <label key={contact.id} className="recipient-item">
                                <input
                                    type="checkbox"
                                    checked={selectedRecipients.includes(contact.id)}
                                    onChange={() => toggleRecipient(contact.id)}
                                />
                                <div className="recipient-info">
                                    <span className="recipient-name">{contact.name}</span>
                                    <span className="recipient-phone">{contact.phone}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="sms-message-area">
                    <h3>Xabar</h3>
                    <textarea
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        rows="5"
                        placeholder="Xabar matnini kiriting..."
                    />
                    <div className="char-count">{smsMessage.length} belgi</div>
                </div>

                <div className="sms-modal-actions">
                    <button
                        type="button"
                        onClick={handleSend}
                        className="btn-primary btn-send-sms"
                        disabled={selectedRecipients.length === 0 || !smsMessage.trim()}
                    >
                        Yuborish ({selectedRecipients.length} ta kontakt)
                    </button>
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Bekor qilish
                    </button>
                </div>
            </div>
        </div>
    );
}
