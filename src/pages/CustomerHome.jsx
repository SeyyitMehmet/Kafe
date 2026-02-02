import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useTables } from '../hooks/useTables';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import { Clock, CheckCircle, ChefHat, XCircle } from 'lucide-react';
import styles from './CustomerHome.module.css';

export default function CustomerHome() {
    const navigate = useNavigate();
    const { tableId: paramTableId } = useParams();
    const { cafe } = useOutletContext();

    // Hooks using cafe.id
    const { products, loading: productsLoading } = useProducts(cafe?.id);
    const { tables, addOrder, loading: tablesLoading } = useTables(cafe?.id);

    const [activeCategory, setActiveCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [tableId, setTableId] = useState(null);

    // Extract unique categories from products
    const categories = useMemo(() => {
        const uniqueCats = [...new Set(products.map(p => p.category))];
        return uniqueCats.map(c => ({ id: c, name: c })); // Simple mapping since category is text
    }, [products]);

    // Set active category when products load
    useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0].id);
        }
    }, [categories, activeCategory]);

    // Handle Table Token logic
    useEffect(() => {
        if (paramTableId) {
            // paramTableId is now the TOKEN (uuid)
            setTableId(paramTableId);
            // Verify if this token corresponds to a valid table in this cafe
            // The tables hook fetches all tables for this cafe
        } else {
            // If no token in URL, they cannot access.
            // QR Code is mandatory.
        }
    }, [paramTableId]);

    // Find current table data by TOKEN
    const currentTable = tables.find(t => t.token === tableId);

    // Filter products
    const filteredProducts = products.filter(p => p.category === activeCategory);

    if (productsLoading || tablesLoading) return <div>Yükleniyor...</div>;

    // Security Check: If tableId exists but no matching table found in this cafe => Invalid Token
    if (tableId && !currentTable && tables.length > 0) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
                <h2>Geçersiz Masa Kodu</h2>
                <p>Lütfen masanızdaki QR kodu tekrar okutunuz.</p>
            </div>
        );
    }

    // If no Token present
    if (!tableId) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
                <h2>Hoşgeldiniz</h2>
                <p>Lütfen masanızdaki QR kodu okutunuz.</p>
            </div>
        );
    }

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
            return [...prev, { ...product, price: Number(product.price), quantity: 1 }];
        });
    };

    const handleRemoveFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const handlePlaceOrder = (note) => {
        if (confirm('Siparişi onaylıyor musunuz?')) {
            addOrder(currentTable.id, cart, note);
            setCart([]);
            alert('Siparişiniz alındı! Onay bekleniyor.');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock size={16} color="orange" />;
            case 'prepared': return <ChefHat size={16} color="#00bcd4" />;
            case 'delivered': return <CheckCircle size={16} color="#4CAF50" />;
            case 'out_of_stock': return <XCircle size={16} color="#ef4444" />;
            default: return null;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Onay Bekliyor';
            case 'prepared': return 'Hazırlanıyor';
            case 'delivered': return 'Teslim Edildi';
            case 'out_of_stock': return 'Stok Bitti';
            default: return status;
        }
    };

    if (productsLoading || tablesLoading) return <div>Yükleniyor...</div>;
    if (!tableId) return null; // Wait for navigation

    const handleUpdateCartItem = (itemId, updates) => {
        setCart(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.tableBadge}>Masa {currentTable?.name || tableId}</div>
                <h1 className={styles.title}>{cafe.name} Menü</h1>
                <p className={styles.subtitle}>Lezzetli seçeneklerimizi keşfedin</p>
            </header>

            {/* Order History / Status Section */}
            {currentTable?.orders.length > 0 && (() => {
                // Calculate total excluding out_of_stock items
                const activeTotal = currentTable.orders
                    .filter(item => item.status !== 'out_of_stock')
                    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

                return (
                    <div className={styles.orderStatusContainer}>
                        <div className={styles.statusHeaderRow}>
                            <h3>Sipariş Durumu</h3>
                            <span className={styles.totalBadge}>Toplam: {activeTotal} ₺</span>
                        </div>
                        <div className={styles.statusList}>
                            {currentTable.orders.slice().reverse().map((item) => (
                                <div key={item.id} className={`${styles.statusItem} ${item.status === 'out_of_stock' ? styles.outOfStockItem : ''}`}>
                                    <div className={styles.statusInfo}>
                                        <div className={styles.itemDetails}>
                                            <span className={styles.statusName}>{item.quantity}x {item.name}</span>
                                            <span className={styles.itemPrice}>
                                                {item.status === 'out_of_stock'
                                                    ? <s>{item.price * item.quantity} ₺</s>
                                                    : `${item.price * item.quantity} ₺`
                                                }
                                            </span>
                                        </div>
                                        <span className={`${styles.statusBadge} ${styles[item.status]}`}>
                                            {getStatusIcon(item.status)} {getStatusText(item.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            <div className={styles.tabs}>
                {categories.map(category => (
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
                total={cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)}
                totalQty={cart.reduce((sum, item) => sum + Number(item.quantity), 0)}
                onRemove={handleRemoveFromCart}
                onComplete={handlePlaceOrder}
                onUpdateItem={handleUpdateCartItem}
            />
        </div>
    );
}
