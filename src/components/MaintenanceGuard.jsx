import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function MaintenanceGuard() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkMaintenance();
        // Subscribe to changes
        const subscription = supabase
            .channel('system_settings')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_settings' }, checkMaintenance)
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const checkMaintenance = async () => {
        try {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single();

            if (data && data.value && data.value.enabled) {
                setMaintenanceMode(true);
            } else {
                setMaintenanceMode(false);
            }
        } catch (e) {
            console.error('Maintenance check error', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null; // Or a spinner

    if (maintenanceMode) {
        // Check if user is Super Admin - bypass maintenance
        const authData = localStorage.getItem('cafeAuth');
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                if (parsed.role === 'super_admin') {
                    return <Outlet />;
                }
            } catch (e) { }
        }
        return <Navigate to="/maintenance" replace />;
    }

    return <Outlet />;
}
