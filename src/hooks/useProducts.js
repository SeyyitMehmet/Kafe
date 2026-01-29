import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initialProducts } from '../data/initialData';

export function useProducts(cafeId) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            if (!supabase || !supabase.from) {
                console.warn('Supabase client not ready, using initial data');
                setProducts(initialProducts);
                return;
            }

            if (!cafeId) {
                // If no cafe is selected (e.g. initial load or not logged in), return empty to prevent data leak
                setProducts([]);
                setLoading(false);
                return;
            }

            let query = supabase
                .from('products')
                .select('*')
                .eq('cafe_id', cafeId) // Strict filtering
                .order('id', { ascending: true });

            // Removed conditional cafeId check because we enforce it above

            const { data, error } = await query;

            if (error) throw error;

            const mappedData = data.map(item => ({
                ...item,
                image: item.image_url
            }));

            setProducts(mappedData);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts(initialProducts);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cafeId) {
            fetchProducts();
        } else {
            setLoading(false);
        }

        // Realtime subscription for product updates
        if (supabase && supabase.channel && cafeId) {
            const subscription = supabase
                .channel('products_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `cafe_id=eq.${cafeId}`
                }, fetchProducts)
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [cafeId]);

    const addProduct = async (product) => {
        if (!supabase || !supabase.from) return;
        try {
            const dbPayload = {
                ...product,
                image_url: product.image,
                cafe_id: cafeId // Ensure product is linked to current cafe
            };
            delete dbPayload.image;

            const { data, error } = await supabase
                .from('products')
                .insert([dbPayload])
                .select();

            if (error) throw error;

            const newProduct = { ...data[0], image: data[0].image_url };
            setProducts(prev => [...prev, newProduct]);
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Ürün eklenirken hata oluştu');
        }
    };

    const updateProduct = async (updatedProduct) => {
        if (!supabase || !supabase.from) return;
        try {
            const dbPayload = {
                ...updatedProduct,
                image_url: updatedProduct.image,
            };
            delete dbPayload.image;

            const { error } = await supabase
                .from('products')
                .update(dbPayload)
                .eq('id', updatedProduct.id);

            if (error) throw error;
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Ürün güncellenirken hata oluştu');
        }
    };

    const deleteProduct = async (id) => {
        if (!supabase || !supabase.from) return;
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Ürün silinirken hata oluştu');
        }
    };

    // Toggle product stock status (active/inactive)
    const toggleProductStock = async (productId, currentStatus) => {
        if (!supabase || !supabase.from) return;
        try {
            const newStatus = !currentStatus;
            const { error } = await supabase
                .from('products')
                .update({ is_active: newStatus })
                .eq('id', productId);

            if (error) throw error;

            // Update local state
            setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, is_active: newStatus } : p
            ));
        } catch (error) {
            console.error('Error toggling product stock:', error);
            alert('Ürün durumu güncellenirken hata oluştu');
        }
    };

    return { products, loading, addProduct, updateProduct, deleteProduct, toggleProductStock };
}
