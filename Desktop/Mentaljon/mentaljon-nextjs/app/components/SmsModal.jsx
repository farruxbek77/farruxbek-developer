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

    const handleSendToContact = (contact) => {
        // Bitta kontaktga SMS yuborish
        const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(smsMessage)}`;
        window.open(smsUrl, '_blank');
    };

    const handleSendToAll = () => {
        const selected = contacts.filter(c => selectedRecipients.includes(c.id));
        if (selected.length === 0) {
            alert('Kamida bitta kontakt tanlang!');
            return;
        }

        // Har bir kontaktga ketma-ket SMS yuborish
        let index = 0;
        const sendNext = () => {
            if (index < selected.length) {
                const contact = selected[index];
                const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(smsMessage)}`;

                if (index === 0) {
                    // Birinchi SMS
                    window.location.href = smsUrl;
                } else {
                    // Keyingi SMSlar uchun yangi oyna
                    setTimeout(() => {
                        window.open(smsUrl, '_blank');
                    }, 1000);
                }
                index++;
                if (index < selected.length) {
                    setTimeout(sendNext, 2000);
                }
            }
        };

        if (confirm(`${selected.length} ta kontaktga xabar yuboriladi. Har bir kontakt uchun SMS oynasi ochiladi. Davom ettirasizmi?`)) {
            onClose();
            sendNext();
        }
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
                            <div key={contact.id} className="recipient-item-wrapper">
                                <label className="recipient-item">
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
                                <button
                                    type="button"
                                    onClick={() => handleSendToContact(contact)}
                                    className="btn-send-individual"
                                    title="Bu kontaktga SMS yuborish"
                                >
                                    SMS
                                </button>
                            </div>
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
                        onClick={handleSendToAll}
                        className="btn-primary btn-send-sms"
                        disabled={selectedRecipients.length === 0 || !smsMessage.trim()}
                    >
                        Hammasiga yuborish ({selectedRecipients.length})
                    </button>
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Bekor qilish
                    </button>
                </div>
            </div>
        </div>
    );
}
