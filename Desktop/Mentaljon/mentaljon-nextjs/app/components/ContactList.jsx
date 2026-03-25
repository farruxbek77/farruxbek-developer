export default function ContactList({ contacts, selectedIds, onToggleSelect, onEdit, onDelete }) {
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            onToggleSelect(contacts.map(c => c.id));
        } else {
            onToggleSelect([]);
        }
    };

    const toggleContact = (id) => {
        if (selectedIds.includes(id)) {
            onToggleSelect(selectedIds.filter(sid => sid !== id));
        } else {
            onToggleSelect([...selectedIds, id]);
        }
    };

    return (
        <div className="contact-list">
            <div className="list-header">
                <label className="checkbox-label">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={selectedIds.length === contacts.length && contacts.length > 0}
                            onChange={handleSelectAll}
                        />
                        <span className="slider"></span>
                    </label>
                    <span>Hammasini tanlash ({selectedIds.length}/{contacts.length})</span>
                </label>
            </div>

            <div className="contacts">
                {contacts.map(contact => (
                    <div key={contact.id} className="contact-card">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(contact.id)}
                                onChange={() => toggleContact(contact.id)}
                            />
                            <span className="slider"></span>
                        </label>
                        <div className="contact-info">
                            <div className="contact-name">{contact.name}</div>
                            <div className="contact-phone">{contact.phone}</div>
                        </div>
                        <div className="contact-actions">
                            <button type="button" onClick={() => onEdit(contact)} className="btn-edit">Edit</button>
                            <button type="button" onClick={() => onDelete(contact.id)} className="btn-delete">Del</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
