import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const INITIAL_TABLES = [
    { id: 1, name: 'Masa 1', status: 'empty', orders: [], total: 0 },
    { id: 2, name: 'Masa 2', status: 'empty', orders: [], total: 0 },
    { id: 3, name: 'Masa 3', status: 'empty', orders: [], total: 0 },
];

export function useTables() {
    const [tables, setTables] = useState(INITIAL_TABLES);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            if (!supabase || !supabase.from) {
                console.warn('Supabase not connected');
                setLoading(false);
                return;
            }

            // Fetch tables
            const { data: tablesData, error: tablesError } = await supabase
                .from('tables')
                .select('*')
                .order('id');

            if (tablesError) throw tablesError;

            // Fetch active orders (not paid)
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('is_paid', false);

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
                            timestamp: order.created_at
                        }))
                    );

                const total = tableOrders.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                return {
                    ...table,
                    orders: tableOrders || [],
                    total: total
                };
            });

            setTables(mergedTables);

            // Fetch payment history (last 10 paid orders)
            const { data: historyData, error: historyError } = await supabase
                .from('orders')
                .select('*, order_items(*), tables(name)')
                .eq('is_paid', true)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!historyError && historyData) {
                // Process history data if needed, or set directly
                const processedHistory = historyData.map(order => ({
                    id: order.id,
                    tableName: order.tables?.name || 'Bilinmeyen Masa',
                    total: order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    items: order.order_items,
                    date: new Date(order.created_at).toLocaleString('tr-TR')
                }));
                setHistory(processedHistory);
            }

        } catch (error) {
            console.error('Error fetching tables data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        if (supabase && supabase.channel) {
            // Realtime Subscription
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
    }, []);

    const addOrder = async (tableId, items) => {
        if (!supabase || !supabase.from) return;
        try {
            // 1. Create main order entry
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{ table_id: tableId, status: 'pending' }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Prepare items with correct order_id and default status
            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                status: 'pending'
            }));

            // 3. Insert items
            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 4. Update table status to occupied
            await supabase
                .from('tables')
                .update({ status: 'occupied' })
                .eq('id', tableId);

        } catch (error) {
            console.error('Error adding order:', error);
            alert('Sipariş eklenirken hata oluştu.');
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

    const clearTable = async (tableId) => {
        if (!supabase || !supabase.from) return;
        try {
            // 1. Mark orders as paid
            const { error: updateError } = await supabase
                .from('orders')
                .update({ is_paid: true, status: 'delivered' }) // Mark as delivered just in case
                .eq('table_id', tableId)
                .eq('is_paid', false);

            if (updateError) throw updateError;

            // 2. Set table to empty
            const { error: tableError } = await supabase
                .from('tables')
                .update({ status: 'empty' })
                .eq('id', tableId);

            if (tableError) throw tableError;

        } catch (error) {
            console.error('Error clearing table:', error);
        }
    };

    return { tables, history, loading, addOrder, updateOrderItemStatus, clearTable };
}
