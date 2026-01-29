import styles from './ProductCard.module.css';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onAdd }) {
    // Check if product is active (default to true if undefined)
    const isActive = product.is_active !== false;

    return (
        <div className={`${styles.card} ${!isActive ? styles.inactiveCard : ''}`}>
            <div className={styles.imageContainer}>
                <img src={product.image} alt={product.name} className={styles.image} referrerPolicy="no-referrer" />
                <div className={styles.priceTag}>{product.price} ₺</div>
                {!isActive && (
                    <div className={styles.outOfStockOverlay}>
                        <span>Stokta Yok</span>
                    </div>
                )}
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{product.name}</h3>
                <p className={styles.description}>{product.description}</p>
                {isActive ? (
                    <button className={styles.addButton} onClick={() => onAdd(product)}>
                        <Plus size={18} />
                        <span>Sipariş Ekle</span>
                    </button>
                ) : (
                    <button className={`${styles.addButton} ${styles.disabledButton}`} disabled>
                        <span>Stokta Yok</span>
                    </button>
                )}
            </div>
        </div>
    );
}
