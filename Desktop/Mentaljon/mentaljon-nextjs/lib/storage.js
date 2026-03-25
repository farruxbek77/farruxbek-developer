// LocalStorage bilan ishlash (demo uchun)

export function getContacts() {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('contacts');
    return data ? JSON.parse(data) : generateInitialContacts();
}

export function saveContacts(contacts) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

export function getGroups() {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('groups');
    return data ? JSON.parse(data) : [];
}

export function saveGroups(groups) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('groups', JSON.stringify(groups));
}

export function getSmsHistory() {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('smsHistory');
    return data ? JSON.parse(data) : [];
}

export function saveSmsHistory(history) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('smsHistory', JSON.stringify(history));
}

export function addSmsToHistory(recipients, message) {
    const history = getSmsHistory();
    const newEntry = {
        id: Date.now(),
        recipients: recipients,
        message: message,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString('uz-UZ')
    };
    history.unshift(newEntry);
    saveSmsHistory(history.slice(0, 50)); // Faqat oxirgi 50 ta
}

function generateInitialContacts() {
    const contacts = [];
    for (let i = 1; i <= 200; i++) {
        contacts.push({
            id: i,
            name: `Kontakt ${i}`,
            phone: `+998${90 + (i % 10)}${String(i).padStart(7, '0')}`,
            email: `kontakt${i}@example.com`
        });
    }
    saveContacts(contacts);
    return contacts;
}
