import { useState } from 'react';
import { Trash2, ShoppingBag, ChevronUp, X } from 'lucide-react';
import styles from './Cart.module.css';

export default function Cart({ items, onRemove, onComplete, onUpdateItem }) {
    const [isOpen, setIsOpen] = useState(false);
    const [note, setNote] = useState('');

    // Calculate totals directly from items prop to ensure they are always in sync
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    // Helper to handle quantity updates if onUpdateItem is provided
    const updateQuantity = (itemId, delta) => {
        if (!onUpdateItem) return;
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty > 0) {
            onUpdateItem(itemId, { quantity: newQty });
        } else {
            // newQty 0 means remove? Or just stop at 1? Usually remove or stop.
            // Let's stop at 1 and let Trash button handle removal to avoid accidents.
        }
    };

    if (items.length === 0) {
        return null;
    }

    if (!isOpen) {
        return (
            <div className={styles.minimizedCart} onClick={() => setIsOpen(true)}>
                <div className={styles.minimizedLeft}>
                    <ShoppingBag size={20} className={styles.bounceIcon} />
                    <span>Sepet ({totalQty})</span>
                </div>
                <div className={styles.minimizedRight}>
                    <span className={styles.minimizedTotal}>{total} ₺</span>
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
                {items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className={styles.item}>
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
                        <div className={styles.itemPrice}>{item.price * item.quantity} ₺</div>
                        <button onClick={() => onRemove(item.id)} className={styles.removeBtn}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <div style={{ marginBottom: '1rem' }}>
                    <textarea
                        placeholder="Sipariş Notu (Örn: Çaylar açık olsun, acı sos olmasın...)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #374151',
                            background: '#1f2937',
                            color: 'white',
                            fontSize: '0.9rem',
                            minHeight: '60px',
                            resize: 'none'
                        }}
                    />
                </div>
                <div className={styles.total}>
                    <span>Toplam:</span>
                    <span>{total} ₺</span>
                </div>
                <button onClick={() => onComplete(note)} className={styles.checkoutBtn}>
                    Siparişi Ver
                </button>
            </div>
        </div>
    );
}
