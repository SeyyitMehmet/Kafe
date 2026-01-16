import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Simple hardcoded check for demo purposes
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/admin');
        } else {
            setError('Geçersiz kullanıcı adı veya şifre');
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
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="admin123"
                        />
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                    <button type="submit" className={styles.submitBtn}>Giriş Yap</button>
                </form>
            </div>
        </div>
    );
}
