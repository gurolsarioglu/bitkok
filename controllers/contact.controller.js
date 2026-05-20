const fs = require('fs');
const path = require('path');
const contentModel = require('../models/content.model');

const MESSAGES_PATH = path.join(__dirname, '..', 'data', 'messages.json');

/* =============================================
   MESAJ DOSYASI YÖNETİMİ
   ============================================= */

function getMessages() {
  try {
    if (fs.existsSync(MESSAGES_PATH)) {
      return JSON.parse(fs.readFileSync(MESSAGES_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Mesaj dosyası okunamadı:', e.message);
  }
  return [];
}

function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_PATH, JSON.stringify(messages, null, 2), 'utf-8');
}

/* =============================================
   FRONTEND: İletişim Formu Gönderimi
   ============================================= */

/** İletişim formu submit */
exports.submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validasyon
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Ad, e-posta ve mesaj alanları zorunludur.' 
    });
  }

  // Email formatı kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Geçerli bir e-posta adresi girin.' 
    });
  }

  // Mesajı kaydet
  const newMessage = {
    id: Date.now().toString(),
    name,
    email,
    subject: subject || '(Konu belirtilmedi)',
    message,
    date: new Date().toISOString(),
    read: false
  };

  const messages = getMessages();
  messages.unshift(newMessage); // En yeni başa
  saveMessages(messages);

  // E-posta göndermeyi dene
  let emailSent = false;
  try {
    emailSent = await sendEmail(newMessage);
  } catch (err) {
    console.error('E-posta gönderilemedi:', err.message);
  }

  res.json({ 
    success: true, 
    emailSent,
    message: 'Mesajınız başarıyla alındı. En kısa sürede size dönüş yapacağız.' 
  });
};

/* =============================================
   E-POSTA GÖNDERİMİ
   ============================================= */

async function sendEmail(msgData) {
  const content = contentModel.getAll();
  const emailSettings = content.contact?.emailSettings;

  if (!emailSettings || !emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPass) {
    console.log('SMTP ayarları yapılandırılmamış, e-posta gönderilmedi.');
    return false;
  }

  // Nodemailer lazy load
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (e) {
    console.error('Nodemailer yüklü değil. npm install nodemailer yapın.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: emailSettings.smtpHost,
    port: parseInt(emailSettings.smtpPort) || 587,
    secure: parseInt(emailSettings.smtpPort) === 465,
    auth: {
      user: emailSettings.smtpUser,
      pass: emailSettings.smtpPass
    }
  });

  const mailOptions = {
    from: `"${emailSettings.senderName || 'Bitkok İletişim'}" <${emailSettings.smtpUser}>`,
    to: emailSettings.recipientEmail || emailSettings.smtpUser,
    replyTo: msgData.email,
    subject: `[Bitkok İletişim] ${msgData.subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:12px;overflow:hidden">
        <div style="background:#1B263B;padding:24px;text-align:center">
          <h2 style="color:#83C5BE;margin:0;font-size:20px">📧 Yeni İletişim Mesajı</h2>
        </div>
        <div style="padding:24px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 12px;font-weight:bold;color:#1B263B;width:120px">Ad Soyad:</td><td style="padding:8px 12px;color:#333">${msgData.name}</td></tr>
            <tr><td style="padding:8px 12px;font-weight:bold;color:#1B263B">E-posta:</td><td style="padding:8px 12px"><a href="mailto:${msgData.email}" style="color:#4F6D7A">${msgData.email}</a></td></tr>
            <tr><td style="padding:8px 12px;font-weight:bold;color:#1B263B">Konu:</td><td style="padding:8px 12px;color:#333">${msgData.subject}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px;border:1px solid #e0e0e0">
            <strong style="color:#1B263B">Mesaj:</strong>
            <p style="color:#555;line-height:1.6;margin-top:8px">${msgData.message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="margin-top:16px;font-size:12px;color:#999;text-align:center">
            Bu mesaj bitkok.com iletişim formundan gönderilmiştir.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  return true;
}

/* =============================================
   ADMIN: Mesaj Yönetimi
   ============================================= */

/** Tüm mesajları getir */
exports.getMessages = (req, res) => {
  const messages = getMessages();
  res.json({ success: true, messages });
};

/** Mesajı okundu olarak işaretle */
exports.markRead = (req, res) => {
  const { id } = req.params;
  const messages = getMessages();
  const msg = messages.find(m => m.id === id);
  if (msg) {
    msg.read = true;
    saveMessages(messages);
  }
  res.json({ success: true });
};

/** Mesajı sil */
exports.deleteMessage = (req, res) => {
  const { id } = req.params;
  let messages = getMessages();
  messages = messages.filter(m => m.id !== id);
  saveMessages(messages);
  res.json({ success: true });
};

/** Test e-postası gönder */
exports.testEmail = async (req, res) => {
  try {
    const result = await sendEmail({
      name: 'Test Kullanıcı',
      email: 'test@bitkok.com',
      subject: 'SMTP Test Mesajı',
      message: 'Bu bir test mesajıdır. SMTP ayarlarınız doğru çalışıyor! 🎉'
    });
    
    if (result) {
      res.json({ success: true, message: 'Test e-postası başarıyla gönderildi!' });
    } else {
      res.json({ success: false, error: 'SMTP ayarları yapılandırılmamış veya Nodemailer yüklü değil.' });
    }
  } catch (err) {
    res.json({ success: false, error: 'E-posta gönderilemedi: ' + err.message });
  }
};
