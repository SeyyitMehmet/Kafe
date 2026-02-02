import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useTables } from '../hooks/useTables';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, X, Armchair, Receipt, ChefHat, Wifi, WifiOff, QrCode, Clock, Upload, Image as ImageIcon, Info, XCircle, Power, PowerOff } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [selectedCafe, setSelectedCafe] = useState(null);
    const [loadingCafe, setLoadingCafe] = useState(true);
    const [daysRemaining, setDaysRemaining] = useState(null);

    // Initialize with selectedCafe?.id (which might be null initially)
    const { products, addProduct, updateProduct, deleteProduct, toggleProductStock } = useProducts(selectedCafe?.id);
    const { tables, history, clearTable, updateOrderItemStatus, cancelOrderItem, addTable, deleteTable } = useTables(selectedCafe?.id);

    const [activeTab, setActiveTab] = useState('orders');
    const [dbStatus, setDbStatus] = useState('checking');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Authenticate from Local Storage
        const authData = localStorage.getItem('cafeAuth');
        if (!authData) {
            navigate('/login');
            return;
        }

        try {
            const cafe = JSON.parse(authData);
            if (cafe && cafe.isAuthenticated) {
                // Fetch fresh data for subscription info
                fetchCafeData(cafe.id).then(freshCafe => {
                    if (freshCafe) {
                        setSelectedCafe(freshCafe);
                        calculateRemainingDays(freshCafe.subscription_end_date);
                    } else {
                        setSelectedCafe(cafe); // Fallback
                    }
                });
                checkConnection();
            } else {
                navigate('/login');
            }
        } catch (e) {
            navigate('/login');
        } finally {
            setLoadingCafe(false);
        }
    }, [navigate]);

    const fetchCafeData = async (id) => {
        const { data } = await supabase.from('cafes').select('*').eq('id', id).single();
        return data;
    };

    const calculateRemainingDays = (dateStr) => {
        if (!dateStr) return;
        const now = new Date();
        const end = new Date(dateStr);
        const diffIndex = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffIndex);
    };

    const checkConnection = async () => {
        try {
            if (!supabase || !supabase.from) {
                setDbStatus('error');
                setErrorMessage('Supabase Client Not Initialized');
                return;
            }
            const { error } = await supabase.from('cafes').select('count', { count: 'exact', head: true });
            if (error) {
                setDbStatus('error');
                setErrorMessage(error.message);
            } else {
                setDbStatus('connected');
                setErrorMessage('');
            }
        } catch (err) {
            setDbStatus('error');
            setErrorMessage(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('cafeAuth');
        navigate('/login');
    };

    // ... (Form State)
    const [editingId, setEditingId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', price: '', category: '', description: '', image: '',
    });

    // Audio Notification Logic
    const pendingOrders = tables?.flatMap(t =>
        t.orders.filter(o => o.status !== 'delivered' && o.status !== 'out_of_stock').map(o => ({ ...o, tableId: t.id, tableName: t.name }))
    ) || [];

    // Audio Notification Logic
    useEffect(() => {
        const currentCount = pendingOrders.length;
        const prevCount = parseInt(sessionStorage.getItem('prevOrderCount') || '0');

        if (currentCount > prevCount) {
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log('Audio play failed (interaction needed):', e));
            } catch (e) { console.error(e); }
        }

        sessionStorage.setItem('prevOrderCount', currentCount.toString());
    }, [pendingOrders.length]);

    // ... (Handlers)
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
            category: '',
            description: '',
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000',
        });
        setIsFormOpen(true);
    };

    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Lütfen geçerli bir resim dosyası yükleyin.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setFormData(prev => ({ ...prev, image: e.target.result }));
        };
        reader.readAsDataURL(file);
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
        if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) deleteProduct(id);
    };

    const handlePayment = (tableId) => {
        const table = tables.find(t => t.id === tableId);
        if (table.orders.some(o => o.status !== 'delivered' && o.status !== 'out_of_stock')) {
            alert('Masada teslim edilmemiş siparişler var!');
            return;
        }
        if (confirm(`Masayı kapatmak istiyor musunuz?`)) clearTable(tableId);
    };

    const advanceItemStatus = (itemId, currentStatus) => {
        let nextStatus = currentStatus === 'pending' ? 'prepared' : currentStatus === 'prepared' ? 'delivered' : null;
        if (nextStatus) updateOrderItemStatus(itemId, nextStatus);
    };

    const handleStockOut = (itemId) => {
        if (confirm('Bu ürün stokta bitti mi? Müşteriye bildirilecek.')) {
            cancelOrderItem(itemId, 'out_of_stock');
        }
    };

    if (loadingCafe) return <div className={styles.container}>Yükleniyor...</div>;
    if (!selectedCafe) return (
        <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
            <h2>Oturum Bilgisi Alınamadı</h2>
            <p>Lütfen tekrar giriş yapınız.</p>
            <button
                onClick={() => navigate('/login')}
                style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '10px' }}
            >
                Giriş Sayfasına Dön
            </button>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <div className={styles.topRow}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <h1>{selectedCafe.name} Yönetim Paneli</h1>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {daysRemaining !== null && (
                                    <div style={{
                                        padding: '5px 10px',
                                        borderRadius: '8px',
                                        background: daysRemaining < 7 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                                        color: daysRemaining < 7 ? '#ef4444' : '#4ade80',
                                        fontSize: '0.9rem',
                                        display: 'flex', alignItems: 'center', gap: '5px'
                                    }}>
                                        <Clock size={16} />
                                        {daysRemaining > 3000 ? 'Sınırsız' : `${daysRemaining} Gün Kaldı`}
                                    </div>
                                )}
                                <button
                                    onClick={() => navigate('/feedback')}
                                    className={styles.statusActionBtn}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <Info size={16} /> Destek
                                </button>
                                <a
                                    href="https://www.npcengineering.com/login"
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.statusActionBtn}
                                    style={{
                                        background: 'rgba(37, 99, 235, 0.2)',
                                        color: '#2563eb',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: '100%'
                                    }}
                                >
                                    Üyeliği Uzat
                                </a>
                                <button onClick={handleLogout} className={styles.statusActionBtn} style={{ background: 'rgba(255,50,50,0.2)' }}>Çıkış Yap</button>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`${styles.statusBadge} ${dbStatus === 'connected' ? styles.statusSuccess : styles.statusError}`}
                        title={errorMessage}
                    >
                        {dbStatus === 'connected' ? <><Wifi size={16} /> Veritabanı Aktif</> : <><WifiOff size={16} /> Hatası</>}
                    </div>
                </div>

                <div className={styles.tabs}>
                    <button className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.activeTab : ''}`} onClick={() => setActiveTab('orders')}>
                        <ChefHat size={18} /> Siparişler
                        {pendingOrders.length > 0 && <span className={styles.badgeCount}>{pendingOrders.length}</span>}
                    </button>
                    <button className={`${styles.tabBtn} ${activeTab === 'tables' ? styles.activeTab : ''}`} onClick={() => setActiveTab('tables')}>
                        <Armchair size={18} /> Masalar
                    </button>
                    <button className={`${styles.tabBtn} ${activeTab === 'products' ? styles.activeTab : ''}`} onClick={() => setActiveTab('products')}>
                        <Receipt size={18} /> Ürünler
                    </button>
                    <button className={`${styles.tabBtn} ${activeTab === 'qr' ? styles.activeTab : ''}`} onClick={() => setActiveTab('qr')}>
                        <QrCode size={18} /> QR Kodlar
                    </button>
                    <button className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`} onClick={() => setActiveTab('history')}>
                        <Receipt size={18} /> Geçmiş
                    </button>
                </div>
            </header>

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
                <div className={styles.ordersGrid}>
                    {tables.filter(t => t.orders.length > 0).length === 0 && (
                        <p className={styles.emptyText}>Aktif sipariş yok.</p>
                    )}
                    {tables.length > 0 && tables.map(table => {
                        // Show all tables that have any orders
                        if (table.orders.length === 0) return null;

                        return (
                            <div key={table.id} className={styles.kitchenCard}>
                                <div className={styles.kitchenHeader}>
                                    <h3>{table.name}</h3>
                                    <span className={styles.timeAgo}>
                                        {table.orders.some(o => o.status === 'pending' || o.status === 'prepared')
                                            ? 'Aktif'
                                            : 'Tamamlandı'}
                                    </span>
                                </div>
                                <div className={styles.kitchenItems}>
                                    {table.orders.map((item) => {
                                        const isDelivered = item.status === 'delivered';
                                        const isOutOfStock = item.status === 'out_of_stock';
                                        const isPassive = isDelivered || isOutOfStock;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`${styles.kitchenItem} ${styles[item.status]} ${isPassive ? styles.passiveItem : ''}`}
                                            >
                                                <div className={styles.itemMeta}>
                                                    <span className={styles.qty}>{item.quantity}x</span>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span className={styles.prodName}>{item.name}</span>
                                                    </div>
                                                    <span className={styles.itemPriceSmall}>{item.price * item.quantity}₺</span>
                                                </div>
                                                <div className={styles.itemActions}>
                                                    {isDelivered ? (
                                                        <span className={styles.statusLabel + ' ' + styles.deliveredLabel}>
                                                            ✓ Teslim Edildi
                                                        </span>
                                                    ) : isOutOfStock ? (
                                                        <span className={styles.statusLabel + ' ' + styles.stockOutLabel}>
                                                            ✗ Stokta Yok
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className={styles.statusActionBtn}
                                                                onClick={() => advanceItemStatus(item.id, item.status)}
                                                            >
                                                                {item.status === 'pending' ? 'Hazırla' : 'Teslim Et'}
                                                            </button>
                                                            {item.status === 'pending' && (
                                                                <button
                                                                    className={`${styles.statusActionBtn} ${styles.stockOutBtn}`}
                                                                    onClick={() => handleStockOut(item.id)}
                                                                    title="Stok Yetersiz"
                                                                >
                                                                    <XCircle size={14} /> Stok Bitti
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TABLES TAB */}
            {activeTab === 'tables' && (
                <>
                    <div className={styles.actionsBar}>
                        <button className={styles.addButton} onClick={addTable}>
                            <Plus size={20} /> Masa Ekle
                        </button>
                    </div>
                    <div className={styles.tablesGrid}>
                        {tables.length > 0 ? tables.map(table => (
                            <div key={table.id} className={`${styles.tableCard} ${table.status === 'occupied' ? styles.occupiedCard : ''}`}>
                                <div className={styles.cardHeader}>
                                    <h3>{table.name}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span className={`${styles.tableStatusBadge} ${table.status === 'occupied' ? styles.statusOccupied : ''}`}>
                                            {table.status === 'occupied' ? 'DOLU' : 'BOŞ'}
                                        </span>
                                        {table.status === 'empty' && (
                                            <button onClick={() => deleteTable(table.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* ... Card Body ... */}
                                <div className={styles.cardBody}>
                                    {table.orders.length > 0 ? (
                                        <div className={styles.orderList}>
                                            <div className={styles.orderScroll}>
                                                {table.orders.map((item, idx) => (
                                                    <div key={idx} className={styles.orderItem}>
                                                        <span>{item.quantity}x {item.name}</span>
                                                        <span>{item.price * item.quantity} ₺</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={styles.orderTotal}>
                                                <span>TOPLAM:</span>
                                                <span>{table.total} ₺</span>
                                            </div>
                                        </div>
                                    ) : <p className={styles.emptyText}>Hesap Yok</p>}
                                </div>
                                {table.status === 'occupied' && (
                                    <button className={styles.payBtn} onClick={() => handlePayment(table.id)}>Ödeme Al & Kapat</button>
                                )}
                            </div>
                        )) : <p>Masa bulunamadı.</p>}
                    </div>
                </>
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
                                <tr><th>Ürün</th><th>Kategori</th><th>Fiyat</th><th>Durum</th><th>İşlemler</th></tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? products.map(product => {
                                    const isActive = product.is_active !== false; // Default to active if undefined
                                    return (
                                        <tr key={product.id} className={!isActive ? styles.inactiveRow : ''}>
                                            <td>{product.name}</td>
                                            <td><span className={styles.badge}>{product.category}</span></td>
                                            <td>{product.price} ₺</td>
                                            <td>
                                                <span className={`${styles.stockBadge} ${isActive ? styles.stockActive : styles.stockInactive}`}>
                                                    {isActive ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        className={`${styles.iconBtn} ${isActive ? styles.deactivateBtn : styles.activateBtn}`}
                                                        onClick={() => toggleProductStock(product.id, isActive)}
                                                        title={isActive ? 'Pasifleştir (Stokta Yok)' : 'Aktifleştir'}
                                                    >
                                                        {isActive ? <PowerOff size={18} /> : <Power size={18} />}
                                                    </button>
                                                    <button className={styles.iconBtn} onClick={() => handleEdit(product)}><Pencil size={18} /></button>
                                                    <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(product.id)}><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : <tr><td colSpan="5" className={styles.emptyText}>Ürün bulunamadı.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* QR TAB */}
            {activeTab === 'qr' && (
                <div className={styles.qrGrid}>
                    {tables.length > 0 ? tables.map(table => (
                        <div key={table.id} className={styles.qrCard} id={`qr-${table.id}`}>
                            <h3>{table.name}</h3>
                            <div className={styles.qrWrapper}>
                                <QRCodeCanvas
                                    value={`${window.location.origin}/cafe/${selectedCafe.slug}/table/${table.token}`}
                                    size={150} level={"H"} includeMargin={true}
                                />
                            </div>
                            <div className={styles.qrActions}>
                                <a
                                    href={`/cafe/${selectedCafe.slug}/table/${table.token}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.visitLinkBtn}
                                >
                                    Müşteri Ekranına Git ↗
                                </a>
                                <button className={styles.printBtn} onClick={() => {
                                    const canvas = document.getElementById(`qr-${table.id}`)?.querySelector('canvas');
                                    if (canvas) {
                                        const link = document.createElement('a');
                                        link.download = `${selectedCafe.name}-${table.name}-QR.png`;
                                        link.href = canvas.toDataURL();
                                        link.click();
                                    }
                                }}>İndir</button>
                            </div>
                        </div>
                    )) : <p>Masa bulunamadı.</p>}
                </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
                <div className={styles.historyGrid}>
                    {history && history.length > 0 ? history.map((order, index) => (
                        <div key={order.id || index} className={styles.receiptCard}>
                            <div className={styles.receiptHeader}>
                                <span className={styles.receiptTable}>{order.tableName}</span>
                                <span className={styles.receiptDate}>{order.date}</span>
                            </div>

                            <div className={styles.receiptItems}>
                                {order.items.map((item, idx) => (
                                    <div key={idx} className={styles.receiptItem}>
                                        <div className={styles.receiptItemName}>
                                            <span>{item.quantity}x</span>
                                            <span>{item.name}</span>
                                        </div>
                                        <span>{item.price * item.quantity} ₺</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.receiptTotal}>
                                <span>TOPLAM:</span>
                                <span>{order.total} ₺</span>
                            </div>
                        </div>
                    )) : <p className={styles.emptyText}>Henüz bir geçmiş bulunmuyor.</p>}
                </div>
            )}

            {/* Modal */}
            {isFormOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? 'Düzenle' : 'Ekle'}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsFormOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Ürün Adı</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Fiyat</label>
                                    <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Kategori</label>
                                    <input type="text" required list="cats" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                    <datalist id="cats">{[...new Set(products.map(p => p.category))].map(c => <option key={c} value={c} />)}</datalist>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Açıklama</label>
                                <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <label>Ürün Görseli</label>
                                    <div className={styles.tooltipContainer}>
                                        <Info size={16} color="#9ca3af" />
                                        <span className={styles.tooltipText}>
                                            Görsel eklemek için bilgisayarınızdan bir dosya sürükleyip bırakabilir, seçebilir veya doğrudan bir URL girebilirsiniz.
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('fileInput').click()}
                                >
                                    <input
                                        type="file"
                                        id="fileInput"
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />

                                    {formData.image ? (
                                        <div style={{ position: 'relative', width: '100%' }}>
                                            <img src={formData.image} alt="Preview" className={styles.imagePreview} />
                                            <button
                                                type="button"
                                                className={styles.removeImageBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, image: '' });
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={styles.uploadPlaceholder}>
                                            <Upload size={32} color="#666" />
                                            <span>Resim Sürükle veya Seç</span>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(PNG, JPG, GIF)</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.orDivider}>veya URL Girin</div>

                                <input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.image}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
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
