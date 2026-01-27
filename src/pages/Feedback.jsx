import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Mail, MessageSquare, User } from 'lucide-react';
import styles from './Feedback.module.css';

export default function Feedback() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch("/api/contact", { // Changed to local API route
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setFormData({ name: '', email: '', message: '' });
            } else {
                alert(data.message || "Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
            }
        } catch (error) {
            console.error("Form error:", error);
            alert("Bağlantı hatası oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ marginBottom: '1rem', color: '#4CAF50' }}>
                        <Send size={48} />
                    </div>
                    <h2 className={styles.title}>Mesajınız Alındı!</h2>
                    <p className={styles.subtitle}>
                        Geri bildiriminiz için teşekkür ederiz. En kısa sürede size dönüş yapacağız.
                    </p>
                    <button onClick={() => navigate(-1)} className={styles.submitBtn} style={{ marginTop: '2rem' }}>
                        <ArrowLeft size={20} /> Geri Dön
                    </button>
                    <button onClick={() => setSuccess(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>
                        Yeni Mesaj Gönder
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <button onClick={() => navigate(-1)} className={styles.backBtn}>
                    <ArrowLeft size={20} /> Geri Dön
                </button>

                <h2 className={styles.title}>Bizimle İletişime Geçin</h2>
                <p className={styles.subtitle}>
                    Kafe sistemi hakkında görüş, öneri ve destek taleplerinizi bize iletin.
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Adınız Soyadınız</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ad Soyad"
                                style={{ paddingLeft: '40px' }}
                            />
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>E-posta Adresiniz</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ornek@email.com"
                                style={{ paddingLeft: '40px' }}
                            />
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mesajınız</label>
                        <textarea
                            name="message"
                            required
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Mesajınızı buraya yazınız..."
                            rows="5"
                        ></textarea>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={submitting}>
                        {submitting ? 'Gönderiliyor...' : <><Send size={20} /> Gönder</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
