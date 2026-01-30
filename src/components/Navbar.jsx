import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo}>
                    <img src="/logo.png" alt="Logo" className={styles.logoImage} />
                    <span>SiparişGo</span>
                </Link>
                {/* Admin link hidden for customers */}
            </div>
        </nav>
    );
}
