import './globals.css';

export const metadata = {
    title: 'Mentaljon - Kontaktlar',
    description: 'Kontaktlarni boshqarish va guruhli xabar yuborish',
};

export default function RootLayout({ children }) {
    return (
        <html lang="uz">
            <body>{children}</body>
        </html>
    );
}
