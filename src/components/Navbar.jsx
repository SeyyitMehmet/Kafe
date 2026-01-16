import { Link } from 'react-router-dom';
import { Coffee, Shield } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo}>
                    <Coffee className={styles.icon} />
                    <span>Kafe İçi</span>
                </Link>
                {/* Admin link hidden for customers */}
            </div>
        </nav>
    );
}
