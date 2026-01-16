import styles from './ProductCard.module.css';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onAdd }) {
    // Use a placeholder for images if they fail or for the initial setup if desired, 
    // but we have URLs in the data.

    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                <img src={product.image} alt={product.name} className={styles.image} referrerPolicy="no-referrer" />
                <div className={styles.priceTag}>{product.price} ₺</div>
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{product.name}</h3>
                <p className={styles.description}>{product.description}</p>
                <button className={styles.addButton} onClick={() => onAdd(product)}>
                    <Plus size={18} />
                    <span>Sipariş Ekle</span>
                </button>
            </div>
        </div>
    );
}
