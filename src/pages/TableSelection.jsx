import { useNavigate } from 'react-router-dom';
import { useTables } from '../hooks/useTables';
import { Armchair } from 'lucide-react';
import styles from './TableSelection.module.css';

export default function TableSelection() {
    const { tables } = useTables();
    const navigate = useNavigate();

    const handleTableSelect = (tableId) => {
        // Save selected table to session for the user's current session
        sessionStorage.setItem('currentTableId', tableId);
        navigate('/');
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Lütfen Masanızı Seçiniz</h1>
            <p className={styles.subtitle}>Sipariş vermek için oturduğunuz masayı seçin</p>

            <div className={styles.grid}>
                {tables.map(table => (
                    <button
                        key={table.id}
                        className={`${styles.card} ${table.status === 'occupied' ? styles.occupied : ''}`}
                        onClick={() => handleTableSelect(table.id)}
                        disabled={table.status === 'occupied'}
                    >
                        <Armchair size={48} className={styles.icon} />
                        <span className={styles.tableName}>{table.name}</span>
                        <span className={styles.status}>
                            {table.status === 'occupied' ? 'DOLU' : 'BOŞ'}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
