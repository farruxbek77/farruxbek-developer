'use client';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import ContactList from './components/ContactList';
import MessageForm from './components/MessageForm';
import ContactForm from './components/ContactForm';
import GroupList from './components/GroupList';
import { getContacts, saveContacts, getGroups, saveGroups, addSmsToHistory } from '@/lib/storage';
import SmsModal from './components/SmsModal';

export default function Home() {
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showContactForm, setShowContactForm] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [theme, setTheme] = useState('light');
    const [showSmsModal, setShowSmsModal] = useState(false);
    const [smsData, setSmsData] = useState({ contacts: [], message: '' });

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        setContacts(getContacts());
        setGroups(getGroups());
    }, []);

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleSaveContact = (formData) => {
        let updatedContacts;
        if (editingContact) {
            updatedContacts = contacts.map(c =>
                c.id === editingContact.id ? { ...formData, id: c.id } : c
            );
        } else {
            const newContact = { ...formData, id: Math.max(...contacts.map(c => c.id), 0) + 1 };
            updatedContacts = [...contacts, newContact];
        }
        setContacts(updatedContacts);
        saveContacts(updatedContacts);
        setShowContactForm(false);
        setEditingContact(null);
    };

    const handleDeleteContact = (id) => {
        if (!confirm('Kontaktni o\'chirmoqchimisiz?')) return;
        const updatedContacts = contacts.filter(c => c.id !== id);
        setContacts(updatedContacts);
        saveContacts(updatedContacts);
        setSelectedIds(selectedIds.filter(sid => sid !== id));
    };

    const handleCreateGroup = () => {
        if (selectedIds.length === 0) {
            alert('Guruh yaratish uchun kontaktlarni tanlang!');
            return;
        }
        const groupName = prompt('Guruh nomini kiriting:');
        if (!groupName) return;
        const newGroup = {
            id: Math.max(...groups.map(g => g.id), 0) + 1,
            name: groupName,
            contactIds: [...selectedIds],
            member_count: selectedIds.length,
            created_at: new Date().toISOString()
        };
        const updatedGroups = [...groups, newGroup];
        setGroups(updatedGroups);
        saveGroups(updatedGroups);
        setSelectedIds([]);
        alert('Guruh yaratildi!');
    };

    const handleSendMessage = (message) => {
        const selectedContacts = contacts.filter(c => selectedIds.includes(c.id));
        if (selectedContacts.length === 0) return;

        // SMS modalni ochish
        setSmsData({ contacts: selectedContacts, message });
        setShowSmsModal(true);
    };

    const handleActualSend = (selectedContacts, message) => {
        if (selectedContacts.length === 0 || !message.trim()) return;

        // SMS tarixiga qo'shish
        addSmsToHistory(selectedContacts, message);

        // Modalni yopish
        setShowSmsModal(false);

        // Har bir kontaktga alohida SMS yuborish
        if (selectedContacts.length === 1) {
            // Bitta kontakt bo'lsa oddiy SMS
            const smsUrl = `sms:${selectedContacts[0].phone}?body=${encodeURIComponent(message)}`;
            window.location.href = smsUrl;
        } else {
            // Ko'p kontakt bo'lsa - foydalanuvchiga tanlash imkoniyati
            const confirmMsg = `${selectedContacts.length} ta kontaktga xabar yuboriladi. Davom ettirasizmi?`;
            if (confirm(confirmMsg)) {
                // Birinchi kontaktga SMS ochish
                const firstContact = selectedContacts[0];
                const smsUrl = `sms:${firstContact.phone}?body=${encodeURIComponent(message)}`;

                // Qolgan kontaktlar haqida ma'lumot
                const remainingContacts = selectedContacts.slice(1);
                const contactNames = remainingContacts.map(c => c.name).join(', ');

                alert(`Birinchi SMS: ${firstContact.name}\n\nQolgan kontaktlar uchun SMS ilovasida "+" tugmasini bosib, xabarni nusxalang:\n${contactNames}`);

                window.location.href = smsUrl;
            }
        }

        // Tanlangan kontaktlarni tozalash
        setSelectedIds([]);
    };

    const handleSendToGroup = (groupId, message) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        const groupContacts = contacts.filter(c => group.contactIds.includes(c.id));
        if (groupContacts.length === 0) return;

        // SMS modalni ochish
        setSmsData({ contacts: groupContacts, message });
        setShowSmsModal(true);
    };

    const handleDeleteGroup = (groupId) => {
        if (!confirm('Guruhni o\'chirmoqchimisiz?')) return;
        const updatedGroups = groups.filter(g => g.id !== groupId);
        setGroups(updatedGroups);
        saveGroups(updatedGroups);
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm)
    );

    return (
        <div className="app">
            <Header theme={theme} changeTheme={changeTheme} />
            <div className="container">
                <div className="toolbar">
                    <input type="text" placeholder="Qidirish..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                    <button type="button" onClick={() => { setShowContactForm(true); setEditingContact(null); }}
                        className="btn-add">+ Kontakt</button>
                    <button type="button" onClick={handleCreateGroup} className="btn-group"
                        disabled={selectedIds.length === 0}>Guruh yaratish ({selectedIds.length})</button>
                </div>
                <GroupList groups={groups} contacts={contacts} onSendToGroup={handleSendToGroup}
                    onDeleteGroup={handleDeleteGroup} />
                <ContactList contacts={filteredContacts} selectedIds={selectedIds}
                    onToggleSelect={setSelectedIds}
                    onEdit={(contact) => { setEditingContact(contact); setShowContactForm(true); }}
                    onDelete={handleDeleteContact} />
                <MessageForm selectedCount={selectedIds.length} onSend={handleSendMessage} />
                {showContactForm && (
                    <ContactForm contact={editingContact} onSave={handleSaveContact}
                        onCancel={() => { setShowContactForm(false); setEditingContact(null); }} />
                )}
                {showSmsModal && (
                    <SmsModal
                        contacts={smsData.contacts}
                        message={smsData.message}
                        onClose={() => setShowSmsModal(false)}
                        onSend={handleActualSend}
                    />
                )}
            </div>
        </div>
    );
}
