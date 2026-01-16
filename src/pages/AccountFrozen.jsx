import styles from '../pages/Login.module.css';
import { Snowflake, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccountFrozen() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.loginCard} style={{ textAlign: 'center' }}>
                <div className={styles.iconContainer} style={{ background: '#eff6ff' }}>
                    <Snowflake size={48} className={styles.icon} color="#3b82f6" />
                </div>

                <h2 className={styles.title} style={{ color: '#1e40af' }}>Hesabınız Donduruldu</h2>

                <p style={{ marginBottom: '2rem', color: '#4b5563', lineHeight: '1.5' }}>
                    Hesabınız geçici olarak dondurulmuştur.
                    <br />
                    Abonelik süreniz bu süreçte <strong>işlemeyecektir</strong>.
                    <br /><br />
                    Tekrar aktif etmek için lütfen yönetim ile iletişime geçiniz.
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
