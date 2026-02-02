import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const INITIAL_TABLES = [
    { id: 1, name: 'Masa 1', status: 'empty', orders: [], total: 0 },
    { id: 2, name: 'Masa 2', status: 'empty', orders: [], total: 0 },
    { id: 3, name: 'Masa 3', status: 'empty', orders: [], total: 0 },
];

export function useTables(cafeId) {
    const [tables, setTables] = useState([]); // Removed static initial tables for clearer loading state
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            if (!supabase || !supabase.from) {
                console.warn('Supabase not connected');
                setLoading(false);
                return;
            }

            if (!cafeId) {
                // Return empty if no cafe is authenticated/selected
                setTables([]);
                setHistory([]);
                setLoading(false);
                return;
            }

            // Fetch tables
            let tablesQuery = supabase
                .from('tables')
                .select('*')
                .eq('cafe_id', cafeId) // Strict filtering
                .order('id');
            // Removed conditional filter since we guard above

            const { data: tablesData, error: tablesError } = await tablesQuery;

            if (tablesError) throw tablesError;

            // Fetch active orders (not paid)
            let ordersQuery = supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('is_paid', false);

            if (cafeId) {
                ordersQuery = ordersQuery.eq('cafe_id', cafeId);
            }

            const { data: ordersData, error: ordersError } = await ordersQuery;

            if (ordersError) throw ordersError;

            // Merge data structures
            const mergedTables = tablesData.map(table => {
                const tableOrders = ordersData
                    .filter(o => o.table_id === table.id)
                    .flatMap(order =>
                        order.order_items.map(item => ({
                            ...item,
                            status: item.status || 'pending', // Use item status specifically
                            orderId: order.id,
                            timestamp: order.created_at,
                            note: order.note // Attach general order note to items for easy access
                        }))
                    );

                const total = tableOrders
                    .filter(item => item.status !== 'out_of_stock')
                    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

                return {
                    ...table,
                    orders: tableOrders || [],
                    total: total
                };
            });

            setTables(mergedTables);

            // Fetch payment history (last 200 rows to ensure we get full 10 groups)
            let historyQuery = supabase
                .from('orders')
                .select('*, order_items(*), tables(name)')
                .eq('is_paid', true)
                .not('paid_at', 'is', null) // Strictly require paid_at
                .order('paid_at', { ascending: false })
                .limit(200);

            if (cafeId) {
                historyQuery = historyQuery.eq('cafe_id', cafeId);
            }

            const { data: historyData, error: historyError } = await historyQuery;

            if (!historyError && historyData) {
                // Client-side Grouping by 'paid_at'
                const groups = {};
                historyData.forEach(order => {
                    const groupKey = order.paid_at; // STRICT: paid_at
                    if (!groupKey) return;

                    if (!groups[groupKey]) {
                        groups[groupKey] = {
                            id: groupKey,
                            tableName: order.tables?.name || 'Bilinmeyen Masa',
                            date: new Date(groupKey).toLocaleString('tr-TR'),
                            items: [],
                            total: 0
                        };
                    }

                    const items = order.order_items.map(item => ({ ...item, original_price: item.price }));
                    groups[groupKey].items.push(...items);
                });

                // Calculate Totals and Format
                const groupedHistory = Object.values(groups)
                    .sort((a, b) => new Date(b.id) - new Date(a.id))
                    .map(group => {
                        // Consolidate identical items within the receipt (e.g. 2x Tea in same bill)
                        const consolidatedItems = {};
                        group.items.forEach(item => {
                            if (consolidatedItems[item.name]) {
                                consolidatedItems[item.name].quantity += item.quantity;
                            } else {
                                consolidatedItems[item.name] = { ...item };
                            }
                        });

                        const finalItems = Object.values(consolidatedItems);
                        const total = finalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                        return { ...group, items: finalItems, total };
                    })
                    .slice(0, 10);

                setHistory(groupedHistory);
            }

        } catch (error) {
            console.error('Error fetching tables data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cafeId) {
            fetchData();
        } else {
            setLoading(false);
        }

        if (supabase && supabase.channel) {
            const subscription = supabase
                .channel('public:everything')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchData)
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [cafeId]);

    const addOrder = async (tableId, items, note = null) => {
        if (!supabase || !supabase.from) return;
        try {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{ table_id: tableId, cafe_id: cafeId, status: 'pending', note: note }])
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                status: 'pending'
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            await supabase
                .from('tables')
                .update({ status: 'occupied' })
                .eq('id', tableId);

        } catch (error) {
            console.error('Error adding order:', error);
            alert('Sipariş eklenirken hata oluştu: ' + error.message);
        }
    };

    const updateOrderItemStatus = async (itemId, newStatus) => {
        if (!supabase || !supabase.from) return;
        try {
            const { error } = await supabase
                .from('order_items')
                .update({ status: newStatus })
                .eq('id', itemId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating item status:', error);
        }
    };

    // Mark an order item as out of stock
    const cancelOrderItem = async (itemId, reason = 'out_of_stock') => {
        if (!supabase || !supabase.from) return;
        try {
            const { error } = await supabase
                .from('order_items')
                .update({ status: reason })
                .eq('id', itemId);

            if (error) throw error;
        } catch (error) {
            console.error('Error cancelling item:', error);
        }
    };

    const clearTable = async (tableId) => {
        if (!supabase || !supabase.from) return;
        try {
            const now = new Date().toISOString();

            // 1. Mark orders as paid AND set paid_at for grouping
            const { error: updateError } = await supabase
                .from('orders')
                .update({ is_paid: true, status: 'delivered', paid_at: now })
                .eq('table_id', tableId)
                .eq('is_paid', false);

            if (updateError) throw updateError;

            // 2. Set table to empty
            const { error: tableError } = await supabase
                .from('tables')
                .update({ status: 'empty' })
                .eq('id', tableId);

            if (tableError) throw tableError;

            // 3. FIFO Cleanup (Keep only last 10 groups)
            // Fetch distinct paid_at timestamps
            const { data: timestamps } = await supabase
                .from('orders')
                .select('paid_at')
                .eq('is_paid', true)
                .eq('cafe_id', cafeId)
                .order('paid_at', { ascending: false }); // Newest first

            if (timestamps && timestamps.length > 0) {
                // Get unique timestamps in JS (Supabase .distict() is weird sometimes)
                const uniqueDates = [...new Set(timestamps.map(t => t.paid_at))];

                if (uniqueDates.length > 10) {
                    const cutoffDate = uniqueDates[10]; // The 11th date (index 10)

                    // Delete everything OLDER than or EQUAL to cutoff (to keep strictly top 10)
                    // Wait, if we keep top 10, we want index 0-9. Index 10 is the first one TO DELETE.
                    // So delete where paid_at <= cutoffDate?
                    // Actually, let's keep it simpler: delete where paid_at <= uniqueDates[10]

                    if (cutoffDate) {
                        const { error: deleteError } = await supabase
                            .from('orders')
                            .delete()
                            .eq('cafe_id', cafeId)
                            .eq('is_paid', true)
                            .lte('paid_at', cutoffDate);

                        if (deleteError) console.error("Cleanup error:", deleteError);
                        else console.log("Cleaned up old history.");
                    }
                }
            }

        } catch (error) {
            console.error('Error clearing table:', error);
        }
    };

    const addTable = async () => {
        if (!supabase || !supabase.from || !cafeId) return;
        try {
            // Find the highest table number currently
            const nextNumber = tables.length + 1;
            const newTableName = `Masa ${nextNumber}`;

            const { error } = await supabase
                .from('tables')
                .insert([{
                    name: newTableName,
                    cafe_id: cafeId,
                    status: 'empty'
                    // token is auto-generated by default uuid function in DB
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error adding table:', error);
            alert('Masa eklenirken hata oluştu: ' + error.message);
        }
    };

    const deleteTable = async (tableId) => {
        if (!supabase || !supabase.from) return;
        try {
            // Check if table has active orders first (optional safety)
            const table = tables.find(t => t.id === tableId);
            if (table && table.orders && table.orders.length > 0) {
                alert("Bu masada açık siparişler var, önce hesabı kapatın.");
                return;
            }

            if (!confirm("Masayı silmek istediğinize emin misiniz?")) return;

            const { error } = await supabase
                .from('tables')
                .delete()
                .eq('id', tableId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting table:', error);
            alert('Masa silinirken hata oluştu.');
        }
    };

    return { tables, history, loading, addOrder, updateOrderItemStatus, cancelOrderItem, clearTable, addTable, deleteTable };
}
