import styles from '../pages/Login.module.css'; // Reusing Login styles for consistency
import { Phone, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionExpired() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.loginCard} style={{ textAlign: 'center' }}>
                <div className={styles.iconContainer} style={{ background: '#fef2f2' }}>
                    <AlertTriangle size={48} className={styles.icon} color="#dc2626" />
                </div>

                <h2 className={styles.title} style={{ color: '#dc2626' }}>Üyelik Süreniz Doldu</h2>

                <p style={{ marginBottom: '2rem', color: '#4b5563', lineHeight: '1.5' }}>
                    Panel erişiminiz askıya alınmıştır. Hesabınızı tekrar aktif hale getirmek için lütfen bizimle iletişime geçiniz.
                </p>

                <div style={{
                    background: '#f3f4f6',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <Phone size={24} color="#2563eb" />
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                        0545 314 55 65
                    </span>
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className={styles.submitBtn}
                    style={{ background: '#4b5563' }}
                >
                    Giriş Ekranına Dön
                </button>
            </div>
        </div>
    );
}
