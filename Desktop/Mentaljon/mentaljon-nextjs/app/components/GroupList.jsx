'use client';

import { useState } from 'react';

export default function GroupList({ groups, contacts, onSendToGroup, onDeleteGroup }) {
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [messages, setMessages] = useState({});

    const handleSend = (groupId) => {
        const message = messages[groupId] || '';
        if (!message.trim()) {
            alert('Xabar matnini kiriting!');
            return;
        }
        onSendToGroup(groupId, message);
        setMessages({ ...messages, [groupId]: '' });
    };

    const updateMessage = (groupId, value) => {
        setMessages({ ...messages, [groupId]: value });
    };

    if (groups.length === 0) return null;

    return (
        <div className="group-list">
            <h2>Guruhlar</h2>
            <div className="groups">
                {groups.map(group => {
                    const groupContacts = contacts.filter(c => group.contactIds.includes(c.id));

                    return (
                        <div key={group.id} className="group-card">
                            <div className="group-header">
                                <div className="group-info">
                                    <h3>{group.name}</h3>
                                    <p>{groupContacts.length} ta kontakt</p>
                                </div>
                                <div className="group-actions">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                                        className="btn-expand"
                                    >
                                        {expandedGroup === group.id ? '▼' : '▶'}
                                    </button>
                                    <button type="button" onClick={() => onDeleteGroup(group.id)} className="btn-delete">Del</button>
                                </div>
                            </div>

                            {expandedGroup === group.id && (
                                <div className="group-details">
                                    <div className="group-members">
                                        <strong>A'zolar:</strong>
                                        <div className="member-list">
                                            {groupContacts.map(c => (
                                                <span key={c.id} className="member-tag">{c.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="group-message-form">
                                        <textarea
                                            placeholder="Guruhga xabar yozing..."
                                            value={messages[group.id] || ''}
                                            onChange={(e) => updateMessage(group.id, e.target.value)}
                                            rows="3"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSend(group.id)}
                                            className="btn-send-group"
                                        >
                                            Guruhga yuborish
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
