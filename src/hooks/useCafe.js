import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCafeData(slug) {
    const [cafe, setCafe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }

        const fetchCafe = async () => {
            try {
                if (!supabase || !supabase.from) throw new Error('No Supabase connection');

                const { data, error } = await supabase
                    .from('cafes')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error) throw error;
                setCafe(data);
            } catch (err) {
                console.error('Error fetching cafe:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCafe();
    }, [slug]);

    return { cafe, loading, error };
}
