import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initialProducts } from '../data/initialData';

export function useProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            // Safety check if supabase is mocked or invalid
            if (!supabase || !supabase.from) {
                console.warn('Supabase client not ready, using initial data');
                setProducts(initialProducts); // Fallback to local data
                return;
            }

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            // Map DB 'image_url' to frontend 'image'
            const mappedData = data.map(item => ({
                ...item,
                image: item.image_url // Use image_url from DB as image in app
            }));

            setProducts(mappedData);
        } catch (error) {
            console.error('Error fetching products:', error);
            // Fallback to initial data on error
            setProducts(initialProducts);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const addProduct = async (product) => {
        if (!supabase || !supabase.from) return;
        try {
            // Prepare payload for DB
            const dbPayload = {
                ...product,
                image_url: product.image, // Map frontend 'image' to DB 'image_url'
            };
            delete dbPayload.image; // Remove frontend-only field

            const { data, error } = await supabase
                .from('products')
                .insert([dbPayload])
                .select();

            if (error) throw error;

            // Map back for local state
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

    return { products, loading, addProduct, updateProduct, deleteProduct };
}
