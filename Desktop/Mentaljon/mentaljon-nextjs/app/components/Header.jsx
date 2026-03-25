export default function Header({ theme, changeTheme }) {
    const themes = [
        { name: 'light', icon: 'Light', label: 'L' },
        { name: 'dark', icon: 'Dark', label: 'D' },
        { name: 'blue', icon: 'Blue', label: 'B' },
        { name: 'green', icon: 'Green', label: 'G' },
        { name: 'purple', icon: 'Purple', label: 'P' }
    ];

    return (
        <header className="header">
            <h1>Mentaljon</h1>
            <div className="theme-selector">
                {themes.map(t => (
                    <button
                        key={t.name}
                        onClick={() => changeTheme(t.name)}
                        className={`theme-btn ${theme === t.name ? 'active' : ''}`}
                        type="button"
                        title={t.icon}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
        </header>
    );
}
