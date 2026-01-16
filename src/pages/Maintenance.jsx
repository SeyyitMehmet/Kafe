import { Construction } from 'lucide-react';

export default function Maintenance() {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#111827',
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <Construction size={64} style={{ color: '#fbbf24', marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Bakımdayız</h1>
            <p style={{ fontSize: '1.1rem', color: '#9ca3af', maxWidth: '500px' }}>
                Sizlere daha iyi hizmet verebilmek için sistemimizde kısa süreliğine bakım çalışması yapıyoruz.
                Anlayışınız için teşekkür ederiz.
            </p>
        </div>
    );
}
