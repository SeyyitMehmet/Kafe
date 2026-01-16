import { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useTables } from '../hooks/useTables';
import { initialCategories } from '../data/initialData';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, X, Armchair, Receipt, ChefHat, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
    const { products, addProduct, updateProduct, deleteProduct } = useProducts();
    const { tables, history, clearTable, updateOrderItemStatus } = useTables();
    const [activeTab, setActiveTab] = useState('orders');
    const [dbStatus, setDbStatus] = useState('checking'); // 'checking', 'connected', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        checkConnection();
    }, []);

    // ... (Connection check function remains same)

    const checkConnection = async () => {
        try {
            if (!supabase || !supabase.from) {
                setDbStatus('error');
                setErrorMessage('Supabase Client Not Initialized');
                return;
            }

            // Try a simple query
            const { count, error } = await supabase.from('tables').select('*', { count: 'exact', head: true });

            if (error) {
                console.error('DB Connection Check Failed:', error);
                setDbStatus('error');
                setErrorMessage(error.message || JSON.stringify(error));
            } else {
                console.log('DB Connection Success');
                setDbStatus('connected');
                setErrorMessage('');
            }
        } catch (err) {
            console.error('DB Connection Exception:', err);
            setDbStatus('error');
            setErrorMessage(err.message || 'Unknown Error');
        }
    };

    // ... (State definitions)
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'sweet',
        description: '',
        image: '',
    });

    // Calculate pending orders
    const pendingOrders = tables.flatMap(t =>
        t.orders.filter(o => o.status !== 'delivered').map(o => ({ ...o, tableId: t.id, tableName: t.name }))
    );

    const handleEdit = (product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description,
            image: product.image || '',
        });
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingId(null);
        setFormData({
            name: '',
            price: '',
            category: 'sweet',
            description: '',
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000',
        });
        setIsFormOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const productData = { ...formData, price: Number(formData.price) };
        if (editingId) {
            updateProduct({ ...productData, id: editingId });
        } else {
            addProduct(productData);
        }
        setIsFormOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
            deleteProduct(id);
        }
    };

    const handlePayment = (tableId) => {
        const table = tables.find(t => t.id === tableId);
        if (table.orders.some(o => o.status !== 'delivered')) {
            alert('Masada hala teslim edilmemiş siparişler var!');
            return;
        }
        if (confirm(`Masa ${tableId} ödemesi alındı ve masa kapatılıyor. Onaylıyor musunuz?`)) {
            clearTable(tableId);
        }
    };

    const advanceItemStatus = (itemId, currentStatus) => {
        let nextStatus;
        if (currentStatus === 'pending') nextStatus = 'prepared';
        else if (currentStatus === 'prepared') nextStatus = 'delivered';

        if (nextStatus) {
            updateOrderItemStatus(itemId, nextStatus);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Yönetim Paneli</h1>
                    <div
                        className={`${styles.statusBadge} ${dbStatus === 'connected' ? styles.statusSuccess : styles.statusError}`}
                        title={errorMessage}
                        onClick={() => errorMessage && alert(errorMessage)}
                        style={{ cursor: errorMessage ? 'help' : 'default' }}
                    >
                        {dbStatus === 'checking' && <span>Bağlanıyor...</span>}
                        {dbStatus === 'connected' && <><Wifi size={16} /> <span>Veritabanı Yayında</span></>}
                        {dbStatus === 'error' && <><WifiOff size={16} /> <span>Bağlantı Hatası: {errorMessage.slice(0, 20)}...</span></>}
                    </div>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <ChefHat size={18} /> Bekleyen Siparişler
                        {pendingOrders.length > 0 && <span className={styles.badgeCount}>{pendingOrders.length}</span>}
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'tables' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('tables')}
                    >
                        <Armchair size={18} /> Masa Hesapları
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'products' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        <Receipt size={18} /> Ürünler
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <Receipt size={18} /> Hesap Geçmişi
                    </button>
                </div>
            </header>

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
                <div className={styles.ordersGrid}>
                    {pendingOrders.length === 0 && <p className={styles.emptyText}>Bekleyen yeni sipariş yok.</p>}
                    {tables.length > 0 && tables.map(table => {
                        const tablePendingOrders = table.orders.filter(o => o.status !== 'delivered');
                        if (tablePendingOrders.length === 0) return null;

                        return (
                            <div key={table.id} className={styles.kitchenCard}>
                                <div className={styles.kitchenHeader}>
                                    <h3>{table.name}</h3>
                                    <span className={styles.timeAgo}>Az önce</span>
                                </div>
                                <div className={styles.kitchenItems}>
                                    {tablePendingOrders.map((item) => (
                                        <div key={item.id} className={`${styles.kitchenItem} ${styles[item.status]}`}>
                                            <div className={styles.itemMeta}>
                                                <span className={styles.qty}>{item.quantity}x</span>
                                                <span className={styles.prodName}>{item.name}</span>
                                            </div>
                                            <button
                                                className={styles.statusActionBtn}
                                                onClick={() => advanceItemStatus(item.id, item.status)}
                                            >
                                                {item.status === 'pending' ? 'Onayla / Hazırla' : 'Teslim Et'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TABLES TAB */}
            {activeTab === 'tables' && (
                <div className={styles.tablesGrid}>
                    {tables.length > 0 ? tables.map(table => (
                        <div key={table.id} className={`${styles.tableCard} ${table.status === 'occupied' ? styles.occupiedCard : ''}`}>
                            <div className={styles.cardHeader}>
                                <h3>{table.name}</h3>
                                <span className={`${styles.tableStatusBadge} ${table.status === 'occupied' ? styles.statusOccupied : ''}`}>
                                    {table.status === 'occupied' ? 'DOLU' : 'BOŞ'}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                {table.orders.length > 0 ? (
                                    <div className={styles.orderList}>
                                        <div className={styles.orderScroll}>
                                            {table.orders.map((item, idx) => (
                                                <div key={idx} className={styles.orderItem}>
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span>
                                                        {item.status === 'delivered' ? <CheckCircle size={14} color="green" /> : <Clock size={14} color="orange" />}
                                                        {' '}{item.price * item.quantity} ₺
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={styles.orderTotal}>
                                            <span>TOPLAM:</span>
                                            <span>{table.total} ₺</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={styles.emptyText}>Hesap Yok</p>
                                )}
                            </div>

                            {table.status === 'occupied' && (
                                <button className={styles.payBtn} onClick={() => handlePayment(table.id)}>
                                    Ödeme Al & Kapat
                                </button>
                            )}
                        </div>
                    )) : <p>Masalar yükleniyor...</p>}
                </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
                <>
                    <div className={styles.actionsBar}>
                        <button className={styles.addButton} onClick={handleAddNew}>
                            <Plus size={20} /> Yeni Ürün Ekle
                        </button>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Ürün Adı</th>
                                    <th>Kategori</th>
                                    <th>Fiyat</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? products.map(product => (
                                    <tr key={product.id}>
                                        <td>{product.name}</td>
                                        <td>
                                            <span className={styles.badge}>
                                                {initialCategories.find(c => c.id === product.category)?.name || product.category}
                                            </span>
                                        </td>
                                        <td>{product.price} ₺</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button className={styles.iconBtn} onClick={() => handleEdit(product)} title="Düzenle">
                                                    <Pencil size={18} />
                                                </button>
                                                <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(product.id)} title="Sil">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className={styles.emptyText}>Ürün bulunamadı veya yükleniyor...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Tarih</th>
                                <th>Masa</th>
                                <th>Tutar</th>
                                <th>Detay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history && history.length > 0 ? history.map(order => (
                                <tr key={order.id}>
                                    <td>{order.date}</td>
                                    <td>{order.tableName}</td>
                                    <td>{order.total} ₺</td>
                                    <td>
                                        <div className={styles.historyItems}>
                                            {order.items.map((item, idx) => (
                                                <span key={idx} className={styles.historyItemBadge}>
                                                    {item.quantity}x {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className={styles.emptyText}>Henüz ödeme geçmişi yok.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal - Same as before */}
            {isFormOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsFormOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Ürün Adı</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Fiyat (₺)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {initialCategories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Açıklama</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Görsel URL</label>
                                <input
                                    type="url"
                                    value={formData.image}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn}>Kaydet</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
