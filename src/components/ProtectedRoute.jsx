import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children, allowedRoles = ['admin'] }) {
    const navigate = useNavigate();
    const authData = localStorage.getItem('cafeAuth');
    let isAuthenticated = false;
    let userRole = 'admin';
    let cafeId = null;

    try {
        if (authData) {
            const parsed = JSON.parse(authData);
            isAuthenticated = parsed && parsed.isAuthenticated;
            if (parsed.role) userRole = parsed.role;
            if (parsed.id) cafeId = parsed.id;
        }
    } catch (e) {
        isAuthenticated = false;
    }

    useEffect(() => {
        if (!isAuthenticated || !cafeId || userRole === 'super_admin') return;

        // 1. Initial Check
        checkStatus();

        // 2. Realtime Subscription
        const channel = supabase
            .channel(`public:cafes:id=eq.${cafeId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cafes', filter: `id=eq.${cafeId}` }, (payload) => {
                const newCafe = payload.new;
                verifyCafeStatus(newCafe);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, cafeId, userRole]);

    const checkStatus = async () => {
        const { data } = await supabase.from('cafes').select('*').eq('id', cafeId).single();
        if (data) verifyCafeStatus(data);
    };

    const verifyCafeStatus = (cafe) => {
        const now = new Date();
        const expiry = cafe.subscription_end_date ? new Date(cafe.subscription_end_date) : new Date(); // Default to now if null/error

        const isPassive = !cafe.is_active;
        const isExpired = expiry < now;

        if (isPassive || isExpired) {
            console.warn('Session invalidated: Cafe is passive or expired.');
            localStorage.removeItem('cafeAuth');

            // Redirect based on reason
            if (isExpired) {
                window.location.href = '/subscription-expired';
            } else {
                // Passive/Other
                window.location.href = '/login';
            }
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
