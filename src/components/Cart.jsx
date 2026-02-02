import { useState } from 'react';
import { Trash2, ShoppingBag, ChevronUp, X } from 'lucide-react';
import styles from './Cart.module.css';

export default function Cart({ items, onRemove, onComplete, onUpdateItem }) {
    const [isOpen, setIsOpen] = useState(false);

    // Helper to handle quantity updates if onUpdateItem is provided
    const updateQuantity = (itemId, delta) => {
        if (!onUpdateItem) return;
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const currentQty = parseInt(item.quantity) || 0;
        const newQty = currentQty + delta;

        if (newQty > 0) {
            onUpdateItem(itemId, { quantity: newQty });
        }
    };

    const calculateTotal = () => items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)), 0);
    const calculateQty = () => items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

    if (items.length === 0) {
        return null;
    }

    if (!isOpen) {
        return (
            <div className={styles.minimizedCart} onClick={() => setIsOpen(true)}>
                <div className={styles.minimizedLeft}>
                    <ShoppingBag size={20} className={styles.bounceIcon} />
                    <span>Sepet ({calculateQty()})</span>
                </div>
                <div className={styles.minimizedRight}>
                    <span className={styles.minimizedTotal}>{calculateTotal()} ₺</span>
                    <ChevronUp size={20} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.cartContainer}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <ShoppingBag size={20} />
                    <h3>Sepetim ({items.length})</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                    <X size={20} />
                </button>
            </div>

            <div className={styles.items}>
                {items.map((item) => (
                    <div key={`${item.id}-${item.quantity}`} className={styles.item}>
                        <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{item.name}</span>
                            <div className={styles.qtyControls}>
                                <button
                                    className={styles.qtyBtn}
                                    onClick={() => updateQuantity(item.id, -1)}
                                    disabled={item.quantity <= 1}
                                >-</button>
                                <span className={styles.itemQty}>{item.quantity}</span>
                                <button
                                    className={styles.qtyBtn}
                                    onClick={() => updateQuantity(item.id, 1)}
                                >+</button>
                            </div>
                        </div>
                        <div className={styles.itemPrice}>{(parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)} ₺</div>
                        <button onClick={() => onRemove(item.id)} className={styles.removeBtn}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <div className={styles.total}>
                    <span>Toplam:</span>
                    <span>{calculateTotal()} ₺</span>
                </div>
                <button onClick={() => onComplete()} className={styles.checkoutBtn}>
                    Siparişi Ver
                </button>
            </div>
        </div>
    );
}
