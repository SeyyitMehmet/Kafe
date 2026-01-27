import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const { data, error } = await supabase
                .from('cafes')
                .select('*')
                .eq('username', username)
                .eq('password', password) // In production, use hashed passwords!
                .single();

            if (error || !data) {
                setError('Geçersiz kullanıcı adı veya şifre');
            } else {
                // AUTHENTICATION SUCCESSFUL - NOW CHECK ROLE & STATUS

                // 1. Super Admin
                if (data.role === 'super_admin') {
                    localStorage.setItem('cafeAuth', JSON.stringify({
                        id: data.id,
                        name: data.name,
                        username: data.username,
                        role: 'super_admin',
                        isAuthenticated: true
                    }));
                    navigate('/super-admin');
                    return;
                }

                // 2. Normal Cafe Admin

                // Priority 1: Frozen Account
                if (data.is_frozen) {
                    navigate('/account-frozen');
                    return;
                }

                // Priority 2: Subscription Expired
                if (data.subscription_end_date) {
                    const expiry = new Date(data.subscription_end_date);
                    const now = new Date();
                    if (expiry < now) {
                        navigate('/subscription-expired');
                        return;
                    }
                }

                // Priority 3: Passive (Manual Admin Disable)
                if (data.is_active === false) {
                    setError('Hesabınız yönetici tarafından pasife alınmıştır. Lütfen iletişime geçiniz.');
                    return;
                }

                // If all good:
                localStorage.setItem('cafeAuth', JSON.stringify({
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    role: 'admin',
                    isAuthenticated: true
                }));
                navigate('/admin');
            }
        } catch (err) {
            console.error(err);
            setError('Giriş yapılırken bir hata oluştu');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.iconContainer}>
                    <Lock size={48} className={styles.icon} />
                </div>
                <h2 className={styles.title}>Admin Girişi</h2>
                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Şifre</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="admin123"
                                style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
                            </button>
                        </div>
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                    <button type="submit" className={styles.submitBtn}>Giriş Yap</button>

                    <a
                        href="https://www.npcengineering.com/login"
                        className={styles.submitBtn}
                        style={{
                            background: '#10b981',
                            marginTop: '1rem',
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'block'
                        }}
                    >
                        Üye Ol
                    </a>

                </form>
            </div>
        </div>
    );
}
