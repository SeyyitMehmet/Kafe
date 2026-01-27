import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Only allow POST method
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Eksik bilgi: Ad, E-posta ve Mesaj zorunludur.' });
    }

    try {
        // Create Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false, // true for 465, false for 587
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false // Helps with self-signed certs if needed, though typically true is safer
            }
        });

        // Email Options
        const mailOptions = {
            from: `"Kafe Feedback" <${process.env.SMTP_USER}>`, // Must match auth user
            to: process.env.MY_EMAIL,
            replyTo: email, // Reply to the user directly
            subject: `Yeni Geri Bildirim: ${name}`,
            text: `Gönderen: ${name}\nE-posta: ${email}\n\nMesaj:\n${message}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h3 style="color: #d4af37;">Yeni Bir Geri Bildirim Var!</h3>
                    <p><strong>Gönderen:</strong> ${name}</p>
                    <p><strong>E-posta:</strong> <a href="mailto:${email}">${email}</a></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p><strong>Mesaj:</strong></p>
                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4af37;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `
        };

        // Send Mail
        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: 'Mesaj başarıyla gönderildi.' });

    } catch (error) {
        console.error('SMTP Error:', error);
        return res.status(500).json({ message: 'Mesaj gönderilemedi.', error: error.message });
    }
}
