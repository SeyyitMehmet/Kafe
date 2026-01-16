import { Outlet, useParams } from 'react-router-dom';
import { useCafeData } from '../hooks/useCafe';

export default function CafeLayout() {
    const { cafeSlug } = useParams();
    const { cafe, loading, error } = useCafeData(cafeSlug);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <div className="spinner"></div>
                <p>Kafe yükleniyor...</p>
            </div>
        );
    }

    if (error || !cafe) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Kafe Bulunamadı</h1>
                <p>Aradığınız işletme mevcut değil veya erişilemiyor.</p>
                <p>{error?.message}</p>
            </div>
        );
    }

    return (
        <div className="cafe-layout">
            <Outlet context={{ cafe }} />
        </div>
    );
}
