import { Trash2, ShoppingBag } from 'lucide-react';
import styles from './Cart.module.css';

export default function Cart({ items, onRemove, onComplete }) {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (items.length === 0) {
        return null;
    }

    return (
        <div className={styles.cartContainer}>
            <div className={styles.header}>
                <ShoppingBag size={20} />
                <h3>Sepetim ({items.length})</h3>
            </div>

            <div className={styles.items}>
                {items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className={styles.item}>
                        <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{item.name}</span>
                            <span className={styles.itemQty}>x{item.quantity}</span>
                        </div>
                        <div className={styles.itemPrice}>{item.price * item.quantity} ₺</div>
                        <button onClick={() => onRemove(item.id)} className={styles.removeBtn}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <div className={styles.total}>
                    <span>Toplam:</span>
                    <span>{total} ₺</span>
                </div>
                <button onClick={onComplete} className={styles.checkoutBtn}>
                    Siparişi Ver
                </button>
            </div>
        </div>
    );
}
