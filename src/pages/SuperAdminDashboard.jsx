import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Power, UserPlus, Bell, ShieldCheck, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import styles from './AdminDashboard.module.css';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [cafes, setCafes] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // New Cafe Form State
    const [newCafe, setNewCafe] = useState({ name: '', slug: '', username: '', password: '' });

    useEffect(() => {
        initializeDashboard();

        // Real-time listener for Orders to update revenue instantly
        const subscription = supabase
            .channel('super-admin-revenue')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const initializeDashboard = async () => {
        await Promise.all([fetchData(), fetchSettings(), fetchNotifications()]);
        // Run lazy cron check for auto-renews
        checkAutoRenewalNodes();
    };

    const fetchData = async () => {
        // 1. Fetch Cafes
        const { data: cafesData, error: cafesError } = await supabase
            .from('cafes')
            .select('*')
            .neq('role', 'super_admin')
            .order('id');

        if (cafesError || !cafesData) {
            setLoading(false);
            return;
        }

        // 2. Fetch Paid Orders for all these cafes to calculate Revenue
        // Ideally we would use a Postgres Function or View for this, but doing it in JS for now since user wants quick edit
        const activeCafeIds = cafesData.map(c => c.id);
        const { data: ordersData } = await supabase
            .from('orders')
            .select(`
                cafe_id,
                order_items (
                    price,
                    quantity
                )
            `)
            .in('cafe_id', activeCafeIds)
            .eq('is_paid', true);

        // 3. Calculate Totals
        const revenueMap = {};
        if (ordersData) {
            ordersData.forEach(order => {
                const orderTotal = order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                if (!revenueMap[order.cafe_id]) revenueMap[order.cafe_id] = 0;
                revenueMap[order.cafe_id] += orderTotal;
            });
        }

        // 4. Merge Revenue into Cafes
        const cafesWithRevenue = cafesData.map(cafe => ({
            ...cafe,
            total_revenue: revenueMap[cafe.id] || 0
        }));

        setCafes(cafesWithRevenue);
        setLoading(false);
    };

    const fetchSettings = async () => {
        const { data } = await supabase.from('system_settings').select('value').eq('key', 'maintenance_mode').single();
        if (data?.value?.enabled) setMaintenanceMode(true);
    };

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('admin_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) setNotifications(data);
    };

    const checkAutoRenewalNodes = async () => {
        // This acts as a "lazy cron" that runs when admin logs in
        const { data: activeCafes } = await supabase.from('cafes').select('*').eq('is_active', true);
        if (!activeCafes) return;

        for (const cafe of activeCafes) {
            if (!cafe.subscription_end_date) continue;

            const expiry = new Date(cafe.subscription_end_date);
            const now = new Date();
            const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

            // 1. Monthly Auto-Renew (2 days before)
            if (cafe.subscription_type === 'monthly' && cafe.auto_renew && daysRemaining <= 2 && daysRemaining > -5) {
                // Check if already renewed today to prevent double charge loop in same session
                // We'll trust the date push.
                // Extend 1 Month
                const newEnd = new Date(expiry);
                newEnd.setMonth(newEnd.getMonth() + 1);

                await supabase.from('cafes').update({ subscription_end_date: newEnd.toISOString() }).eq('id', cafe.id);
                await addNotification(`OTOMATİK YENİLEME: ${cafe.name} aylık aboneliği yenilendi.`, 'success', cafe.id);
                console.log(`Auto renewed ${cafe.name}`);
            }

            // 2. Yearly Warning (10 days before)
            if (cafe.subscription_type === 'yearly' && daysRemaining <= 10 && daysRemaining > 0) {
                // Check if we notified today
                await addNotification(`UYARI: ${cafe.name} yıllık aboneliği bitiyor! (${daysRemaining} gün kaldı)`, 'warning', cafe.id);
            }
        }
        // Refresh data after checks
        fetchData();
        fetchNotifications();
    };

    const addNotification = async (message, type = 'info', cafeId = null) => {
        // Simple deduplication for today
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const { data: existing } = await supabase
            .from('admin_notifications')
            .select('*')
            .eq('cafe_id', cafeId)
            .eq('message', message)
            .gte('created_at', startOfDay.toISOString());

        if (existing && existing.length > 0) return; // Already notified today

        const { error } = await supabase.from('admin_notifications').insert([{ message, type, cafe_id: cafeId }]);
        if (error) console.error(error);
    };

    const toggleMaintenanceMetrics = async () => {
        const newState = !maintenanceMode;
        const { error } = await supabase
            .from('system_settings')
            .upsert({ key: 'maintenance_mode', value: { enabled: newState } });
        if (!error) setMaintenanceMode(newState);
    };

    const handleLogout = () => {
        localStorage.removeItem('cafeAuth');
        navigate('/login');
    };

    const toggleCafeStatus = async (cafe) => {
        const newStatus = !cafe.is_active;
        const { error } = await supabase.from('cafes').update({ is_active: newStatus }).eq('id', cafe.id);
        if (!error) fetchData();
    };

    const toggleAutoRenew = async (cafe) => {
        const newStatus = !cafe.auto_renew;
        const { error } = await supabase.from('cafes').update({ auto_renew: newStatus }).eq('id', cafe.id);
        if (!error) fetchData();
    };

    const toggleFreeze = async (cafe) => {
        if (cafe.is_frozen) {
            // UNFREEZE LOGIC
            if (!cafe.frozen_at) {
                // If no frozen_at, just unfreeze without extending
                await supabase.from('cafes').update({ is_frozen: false, is_active: true }).eq('id', cafe.id);
            } else {
                const frozenAt = new Date(cafe.frozen_at);
                const now = new Date();
                const durationMs = now - frozenAt; // Duration in ms

                // Add duration to current subscription_end_date
                const currentEnd = new Date(cafe.subscription_end_date);
                const newEnd = new Date(currentEnd.getTime() + durationMs);

                await supabase.from('cafes').update({
                    is_frozen: false,
                    is_active: true, // Auto activate
                    frozen_at: null,
                    subscription_end_date: newEnd.toISOString()
                }).eq('id', cafe.id);

                alert(`Hesap çözüldü! Süre ${Math.floor(durationMs / (1000 * 60 * 60 * 24))} gün uzatıldı.`);
            }
        } else {
            // FREEZE LOGIC
            if (!confirm(`"${cafe.name}" hesabını dondurmak istediğinize emin misiniz? (Süre durdurulacak)`)) return;

            await supabase.from('cafes').update({
                is_frozen: true,
                frozen_at: new Date().toISOString(),
                is_active: false // Disable login
            }).eq('id', cafe.id);
        }
        fetchData();
    };

    const deleteCafe = async (cafeId) => {
        if (!confirm('DİKKAT: Bu kafeyi ve tüm verilerini silmek üzeresiniz! Bu işlem geri alınamaz. Emin misiniz?')) return;
        if (!confirm('SON KARARINIZ MI? (Siliniyor...)')) return;

        const { error } = await supabase.from('cafes').delete().eq('id', cafeId);
        if (error) {
            alert('Silme hatası: ' + error.message);
        } else {
            alert('Kafe başarıyla silindi.');
            fetchData();
        }
    };

    const extendSubscription = async (cafeId, type) => {
        const cafe = cafes.find(c => c.id === cafeId);
        let currentEnd = cafe.subscription_end_date ? new Date(cafe.subscription_end_date) : new Date();
        if (currentEnd < new Date()) currentEnd = new Date();

        let subType = cafe.subscription_type || 'monthly';
        let autoRenew = cafe.auto_renew;

        if (type === 'month') {
            currentEnd.setMonth(currentEnd.getMonth() + 1);
            subType = 'monthly';
            autoRenew = true;
        }
        if (type === 'year') {
            currentEnd.setFullYear(currentEnd.getFullYear() + 1);
            subType = 'yearly';
            autoRenew = false;
        }
        if (type === 'lifetime') {
            currentEnd = new Date('2099-12-31');
            subType = 'lifetime';
            autoRenew = false;
        }

        const { error } = await supabase
            .from('cafes')
            .update({
                subscription_end_date: currentEnd.toISOString(),
                is_active: true,
                subscription_type: subType,
                auto_renew: autoRenew,
                is_frozen: false
            })
            .eq('id', cafeId);

        if (!error) {
            alert('Abonelik uzatıldı!');
            fetchData();
        }
    };

    const handleAddCafe = async (e) => {
        e.preventDefault();
        try {
            // Default 7 Days Trial
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 7);

            const { data, error } = await supabase.from('cafes').insert([{
                ...newCafe,
                role: 'admin',
                is_active: true,
                subscription_end_date: trialEnd.toISOString(),
                subscription_type: 'trial',
                auto_renew: false
            }]).select();

            if (error) throw error;
            fetchData();
            setShowAddModal(false);
            setNewCafe({ name: '', slug: '', username: '', password: '' });
            alert('Kafe başarıyla eklendi (7 Günlük Deneme)');
        } catch (err) {
            alert('Hata: ' + err.message);
        }
    };

    if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Yükleniyor...</div>;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ShieldCheck size={32} color="#4ade80" />
                    <h1>Süper Yönetici Paneli</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', position: 'relative' }}
                        >
                            <Bell size={24} />
                            {notifications.length > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifications.length}</span>}
                        </button>

                        {showNotifications && (
                            <div style={{
                                position: 'absolute', top: '40px', right: 0, width: '300px',
                                background: '#1f2937', border: '1px solid #374151', borderRadius: '8px',
                                padding: '10px', zIndex: 100, maxHeight: '400px', overflowY: 'auto',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #374151', paddingBottom: '5px' }}>Bildirimler</h4>
                                {notifications.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Bildirim yok</p> : (
                                    notifications.map(n => (
                                        <div key={n.id} style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                                {n.type === 'warning' ? <AlertTriangle size={14} color="#facc15" /> : <CheckCircle size={14} color="#4ade80" />}
                                                <span style={{ fontWeight: 'bold', color: n.type === 'warning' ? '#facc15' : '#4ade80' }}>
                                                    {n.type === 'warning' ? 'Uyarı' : 'Bilgi'}
                                                </span>
                                            </div>
                                            <div style={{ color: '#d1d5db' }}>{n.message}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>{new Date(n.created_at).toLocaleDateString()}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={toggleMaintenanceMetrics}
                        style={{
                            background: maintenanceMode ? '#ef4444' : '#22c55e',
                            color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Power size={18} />
                        {maintenanceMode ? 'Bakım Modunu Kapat' : 'Bakım Modunu Aç'}
                    </button>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={18} /> Çıkış
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Kafe Listesi</h2>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <UserPlus size={18} /> Yeni Kafe Ekle
                    </button>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Kafe Adı</th>
                                <th>Tür</th>
                                <th>Oto. Yenileme</th>
                                <th>Durum</th>
                                <th>Abonelik Bitiş</th>
                                <th>Toplam Ciro</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cafes.map(cafe => {
                                const isExpired = cafe.subscription_end_date && new Date(cafe.subscription_end_date) < new Date();
                                const daysRemaining = cafe.subscription_end_date
                                    ? Math.ceil((new Date(cafe.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24))
                                    : 0;

                                return (
                                    <tr key={cafe.id}>
                                        <td>
                                            <div>{cafe.name}</div>
                                            <div style={{ fontSize: '0.8em', color: '#9ca3af' }}>{cafe.username}</div>
                                        </td>
                                        <td>
                                            <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', badge: 'gray' }}>{cafe.subscription_type || '-'}</span>
                                        </td>
                                        <td>
                                            {cafe.subscription_type === 'monthly' && (
                                                <button
                                                    onClick={() => toggleAutoRenew(cafe)}
                                                    style={{
                                                        background: cafe.auto_renew ? '#10b981' : '#374151',
                                                        color: 'white', border: 'none', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer'
                                                    }}
                                                >
                                                    {cafe.auto_renew ? 'AÇIK' : 'KAPALI'}
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: cafe.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: cafe.is_active ? '#4ade80' : '#ef4444'
                                            }}>
                                                {cafe.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="date"
                                                    value={cafe.subscription_end_date ? new Date(cafe.subscription_end_date).toISOString().split('T')[0] : ''}
                                                    onChange={async (e) => {
                                                        const newDate = new Date(e.target.value);
                                                        newDate.setHours(23, 59, 59, 999);

                                                        const { error } = await supabase
                                                            .from('cafes')
                                                            .update({ subscription_end_date: newDate.toISOString(), is_active: newDate > new Date() })
                                                            .eq('id', cafe.id);

                                                        if (!error) fetchData();
                                                    }}
                                                    style={{
                                                        background: '#374151',
                                                        color: isExpired ? '#ef4444' : 'white',
                                                        border: '1px solid #4b5563',
                                                        borderRadius: '4px', padding: '4px', width: '130px'
                                                    }}
                                                />
                                                {!isExpired && daysRemaining > 0 && daysRemaining < 3650 && (
                                                    <span style={{ fontSize: '0.85em', color: '#9ca3af', minWidth: '60px' }}>({daysRemaining} gün)</span>
                                                )}
                                                {daysRemaining > 3650 && <span style={{ fontSize: '1.2em' }}>∞</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cafe.total_revenue || 0)}
                                            </span>
                                        </td>
                                        <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <button
                                                title="Sıfırla"
                                                onClick={async () => {
                                                    if (!confirm('Üyeliği iptal etmek (sıfırlamak) istediğinize emin misiniz?')) return;
                                                    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                                                    await supabase.from('cafes').update({ subscription_end_date: yesterday.toISOString(), is_active: false }).eq('id', cafe.id);
                                                    fetchData();
                                                }}
                                                style={{ background: '#ef4444', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Sıfırla
                                            </button>

                                            <button
                                                onClick={() => toggleFreeze(cafe)}
                                                style={{
                                                    background: cafe.is_frozen ? '#3b82f6' : '#06b6d4',
                                                    border: 'none', color: 'white', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer'
                                                }}
                                                title={cafe.is_frozen ? 'Dondurmayı Kaldır (Süre Ekle)' : 'Hesabı Dondur'}
                                            >
                                                {cafe.is_frozen ? 'Çöz' : 'Dondur'}
                                            </button>

                                            <button
                                                onClick={() => deleteCafe(cafe.id)}
                                                style={{ background: '#991b1b', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                                title="Tamamen Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div style={{ width: '1px', height: '24px', background: '#525252', margin: '0 4px' }}></div>
                                            <button onClick={() => extendSubscription(cafe.id, 'month')} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>+1 Ay</button>
                                            <button onClick={() => extendSubscription(cafe.id, 'year')} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>+1 Yıl</button>
                                            <button onClick={() => extendSubscription(cafe.id, 'lifetime')} style={{ background: '#eab308', border: 'none', color: 'black', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>∞</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1f2937', padding: '2rem', borderRadius: '12px', width: '400px', border: '1px solid #374151' }}>
                        <h3>Yeni Kafe Ekle (7 Gün Deneme)</h3>
                        <form onSubmit={handleAddCafe} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <input
                                placeholder="Kafe Adı" value={newCafe.name}
                                onChange={e => setNewCafe({ ...newCafe, name: e.target.value })}
                                style={{ padding: '10px', background: '#374151', border: '1px solid #4b5563', color: 'white', borderRadius: '6px' }} required
                            />
                            <input
                                placeholder="Slug" value={newCafe.slug}
                                onChange={e => setNewCafe({ ...newCafe, slug: e.target.value })}
                                style={{ padding: '10px', background: '#374151', border: '1px solid #4b5563', color: 'white', borderRadius: '6px' }} required
                            />
                            <input
                                placeholder="Kullanıcı Adı" value={newCafe.username}
                                onChange={e => setNewCafe({ ...newCafe, username: e.target.value })}
                                style={{ padding: '10px', background: '#374151', border: '1px solid #4b5563', color: 'white', borderRadius: '6px' }} required
                            />
                            <input
                                placeholder="Şifre" type="password" value={newCafe.password}
                                onChange={e => setNewCafe({ ...newCafe, password: e.target.value })}
                                style={{ padding: '10px', background: '#374151', border: '1px solid #4b5563', color: 'white', borderRadius: '6px' }} required
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #4b5563', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>İptal</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', background: '#22c55e', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
