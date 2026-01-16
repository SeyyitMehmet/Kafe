import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useTables } from '../hooks/useTables';
import { initialCategories } from '../data/initialData';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import { Clock, CheckCircle, ChefHat } from 'lucide-react';
import styles from './CustomerHome.module.css';

export default function CustomerHome() {
    const navigate = useNavigate();
    const { products } = useProducts();
    const { tables, addOrder } = useTables();

    const [activeCategory, setActiveCategory] = useState(initialCategories[0].id);
    const [cart, setCart] = useState([]);
    const [tableId, setTableId] = useState(null);

    useEffect(() => {
        const activeTable = sessionStorage.getItem('currentTableId');
        if (!activeTable) {
            navigate('/select-table');
        } else {
            setTableId(Number(activeTable));
        }
    }, [navigate]);

    const currentTable = tables.find(t => t.id === tableId);
    const filteredProducts = products.filter(p => p.category === activeCategory);

    const handleAddToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const handleRemoveFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const handlePlaceOrder = () => {
        if (confirm('Siparişi onaylıyor musunuz?')) {
            addOrder(tableId, cart);
            setCart([]);
            alert('Siparişiniz alındı! Onay bekleniyor.');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock size={16} color="orange" />;
            case 'prepared': return <ChefHat size={16} color="#00bcd4" />;
            case 'delivered': return <CheckCircle size={16} color="#4CAF50" />;
            default: return null;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Onay Bekliyor';
            case 'prepared': return 'Hazırlanıyor';
            case 'delivered': return 'Teslim Edildi';
            default: return status;
        }
    };

    if (!tableId) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.tableBadge}>Masa {tableId}</div>
                <h1 className={styles.title}>Menü</h1>
                <p className={styles.subtitle}>Lezzetli seçeneklerimizi keşfedin</p>
            </header>

            {/* Order History / Status Section */}
            {currentTable?.orders.length > 0 && (
                <div className={styles.orderStatusContainer}>
                    <div className={styles.statusHeaderRow}>
                        <h3>Sipariş Durumu</h3>
                        <span className={styles.totalBadge}>Toplam: {currentTable.total} ₺</span>
                    </div>
                    <div className={styles.statusList}>
                        {currentTable.orders.slice().reverse().map((item) => (
                            <div key={item.id} className={styles.statusItem}>
                                <div className={styles.statusInfo}>
                                    <span className={styles.statusName}>{item.quantity}x {item.name}</span>
                                    <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                                        {getStatusIcon(item.status)} {getStatusText(item.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.tabs}>
                {initialCategories.map(category => (
                    <button
                        key={category.id}
                        className={`${styles.tab} ${activeCategory === category.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveCategory(category.id)}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className={styles.grid}>
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAdd={handleAddToCart} />
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className={styles.emptyState}>Bu kategoride henüz ürün bulunmuyor.</div>
            )}

            <Cart
                items={cart}
                onRemove={handleRemoveFromCart}
                onComplete={handlePlaceOrder}
            />
        </div>
    );
}
