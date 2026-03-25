'use client';

import { useState, useEffect } from 'react';

export default function ContactForm({ contact, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (contact) {
            setFormData(contact);
        }
    }, [contact]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>{contact ? 'Kontaktni tahrirlash' : 'Yangi kontakt'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Ism"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <input
                        type="tel"
                        placeholder="Telefon"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <div className="modal-actions">
                        <button type="submit" className="btn-primary">Saqlash</button>
                        <button type="button" onClick={onCancel} className="btn-secondary">Bekor qilish</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
