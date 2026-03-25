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

    const handleSendToContact = (contact) => {
        // Bitta kontaktga xabar yuborish - Android Xabarlar ilovasini ochadi
        const encodedMessage = encodeURIComponent(smsMessage);
        const phoneNumber = contact.phone.replace(/[^0-9+]/g, ''); // Faqat raqamlar

        // sms: protokoli Android Xabarlar ilovasini ochadi
        const smsUrl = `sms:${phoneNumber}?body=${encodedMessage}`;

        // Xabarlar ilovasini ochish
        window.location.href = smsUrl;
    };

    const handleSendToAll = () => {
        const selected = contacts.filter(c => selectedRecipients.includes(c.id));
        if (selected.length === 0) {
            alert('Kamida bitta kontakt tanlang!');
            return;
        }

        const confirmMsg = `${selected.length} ta kontaktga xabar yuboriladi.\n\nHar bir kontakt uchun Xabarlar ilovasi ochiladi.\n\nDavom ettirasizmi?`;

        if (confirm(confirmMsg)) {
            onClose();

            // Birinchi kontaktga xabar yuborish
            if (selected.length > 0) {
                const encodedMessage = encodeURIComponent(smsMessage);
                const phoneNumber = selected[0].phone.replace(/[^0-9+]/g, '');
                const smsUrl = `sms:${phoneNumber}?body=${encodedMessage}`;

                // Qolgan kontaktlar haqida ma'lumot
                if (selected.length > 1) {
                    const remainingNames = selected.slice(1).map(c => `${c.name} (${c.phone})`).join('\n');
                    setTimeout(() => {
                        alert(`Birinchi xabar: ${selected[0].name}\n\nQolgan ${selected.length - 1} ta kontakt:\n${remainingNames}\n\nHar biriga alohida xabar yuborish uchun "Xabar" tugmasini bosing.`);
                    }, 500);
                }

                window.location.href = smsUrl;
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal sms-send-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sms-modal-header">
                    <h2>Xabar Yuborish</h2>
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
                                    title="Bu kontaktga xabar yuborish"
                                >
                                    Xabar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sms-message-area">
                    <h3>Xabar matni</h3>
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
                        Birinchisiga yuborish ({selectedRecipients.length})
                    </button>
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Bekor qilish
                    </button>
                </div>
            </div>
        </div>
    );
}
