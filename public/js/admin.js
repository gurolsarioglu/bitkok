/* ============================================
   BITKOK ADMIN PANEL JS
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {

  // --- Sidebar Toggle (Mobile) ---
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  if (toggle) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // --- Toast Notification ---
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // --- Form Submit (AJAX) ---
  document.querySelectorAll('.edit-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const section = form.dataset.section;
      const formData = new FormData(form);
      const data = {};

      // Parse form data into nested object
      for (const [key, value] of formData.entries()) {
        // Handle dot notation: fonts.heading, colors.primary etc.
        if (key.includes('.') && !key.includes('[')) {
          const parts = key.split('.');
          if (!data[parts[0]]) data[parts[0]] = {};
          data[parts[0]][parts[1]] = value;
        }
        // Handle array notation: items[0].title
        else {
          const match = key.match(/^(\w+)\[(\d+)\]\.?(\w*)$/);
          if (match) {
            const [, arrayName, index, field] = match;
            if (!data[arrayName]) data[arrayName] = [];
            if (!data[arrayName][parseInt(index)]) data[arrayName][parseInt(index)] = {};
            if (field) {
              data[arrayName][parseInt(index)][field] = value;
            } else {
              data[arrayName][parseInt(index)] = value;
            }
          } else if (key.startsWith('social_')) {
            if (!data.socialMedia) data.socialMedia = {};
            data.socialMedia[key.replace('social_', '')] = value;
          } else {
            data[key] = value;
          }
        }
      }

      // Convert number strings to numbers for stats
      if (data.stats) {
        data.stats = data.stats.map(s => ({
          ...s,
          number: parseInt(s.number) || 0
        }));
      }

      try {
        const res = await fetch(`/admin/api/section/${section}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          showToast('✓ Başarıyla kaydedildi!', 'success');
        } else {
          showToast('Hata: ' + (result.error || 'Bilinmeyen hata'), 'error');
        }
      } catch (err) {
        showToast('Bağlantı hatası!', 'error');
      }
    });
  });

  // --- Image Upload ---
  document.querySelectorAll('.file-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const category = input.dataset.category || input.id.replace('File', '').replace(/\d+/, '').toLowerCase();
      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch(`/admin/api/upload/${category}`, {
          method: 'POST',
          body: formData
        });
        const result = await res.json();
        if (result.success) {
          // Update preview
          const preview = input.previousElementSibling || document.querySelector(`#${input.id.replace('File', 'Preview')}`);
          if (preview && preview.tagName === 'IMG') {
            preview.src = result.path;
          } else {
            // Replace placeholder with img
            const img = document.createElement('img');
            img.src = result.path;
            img.className = 'preview-image';
            const area = input.closest('.image-upload-area');
            const placeholder = area.querySelector('.preview-placeholder');
            if (placeholder) placeholder.replaceWith(img);
          }
          showToast('✓ Görsel yüklendi!', 'success');

          // Auto-save the image path to content.json
          const section = input.closest('.edit-form')?.dataset.section;
          if (section && category !== 'blog') {
            await fetch(`/admin/api/section/${section}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: result.path })
            });
          } else if (section === 'settings' && category === 'logo') {
            await fetch('/admin/api/section/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logo: result.path })
            });
          }
        } else {
          showToast('Yükleme hatası: ' + result.error, 'error');
        }
      } catch (err) {
        showToast('Yükleme bağlantı hatası!', 'error');
      }
    });
  });

  // Logo upload special handling
  const logoInput = document.getElementById('logoFile');
  if (logoInput) {
    logoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch('/admin/api/upload/logo', { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
          const preview = document.getElementById('logoPreview');
          if (preview.tagName === 'IMG') {
            preview.src = result.path;
          } else {
            const img = document.createElement('img');
            img.src = result.path;
            img.className = 'preview-image';
            img.id = 'logoPreview';
            preview.replaceWith(img);
          }
          await fetch('/admin/api/section/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logo: result.path })
          });
          showToast('✓ Logo güncellendi!', 'success');
        }
      } catch (err) {
        showToast('Logo yükleme hatası!', 'error');
      }
    });
  }

  // --- Design System: Color Hex Update ---
  document.querySelectorAll('input[type="color"]').forEach(input => {
    input.addEventListener('input', () => {
      const span = input.parentElement.querySelector('span');
      if (span) span.textContent = input.value.toUpperCase();
    });
  });

  // --- Design System: Font Preview ---
  document.querySelectorAll('.font-select').forEach(select => {
    const previewId = select.dataset.preview;
    const preview = document.getElementById(previewId);
    if (preview) {
      // Initial
      preview.style.fontFamily = `'${select.value}', sans-serif`;
      // Load font dynamically
      const loadFont = (fontName) => {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      };
      loadFont(select.value);
      select.addEventListener('change', () => {
        loadFont(select.value);
        setTimeout(() => {
          preview.style.fontFamily = `'${select.value}', sans-serif`;
        }, 300);
      });
    }
  });

  // --- Design System: Range Slider Value ---
  document.querySelectorAll('.range-input').forEach(input => {
    const valueSpan = input.nextElementSibling;
    if (valueSpan && valueSpan.classList.contains('range-value')) {
      input.addEventListener('input', () => {
        const divide = input.dataset.divide;
        const val = divide ? (parseFloat(input.value) / parseFloat(divide)).toFixed(2) : input.value;
        valueSpan.textContent = divide ? val : val + 'px';
      });
    }
  });

  // --- Password Change Form ---
  const pwdForm = document.getElementById('changePasswordForm');
  if (pwdForm) {
    // Password strength indicator
    const newPwd = document.getElementById('newPassword');
    const strengthEl = document.getElementById('passwordStrength');
    if (newPwd && strengthEl) {
      newPwd.addEventListener('input', () => {
        const val = newPwd.value;
        let score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 10) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;
        
        const labels = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü', 'Çok Güçlü'];
        const colors = ['', '#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#27ae60'];
        const pct = (score / 5) * 100;
        
        strengthEl.innerHTML = val.length > 0 ? `
          <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${colors[score]};transition:0.3s;border-radius:2px"></div>
          </div>
          <div style="font-size:0.75rem;color:${colors[score]};margin-top:4px">${labels[score]}</div>
        ` : '';
      });
    }

    pwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (newPassword !== confirmPassword) {
        showToast('Yeni şifreler eşleşmiyor!', 'error');
        return;
      }
      if (newPassword.length < 6) {
        showToast('Şifre en az 6 karakter olmalı!', 'error');
        return;
      }

      try {
        const res = await fetch('/admin/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
        });
        const result = await res.json();
        if (result.success) {
          showToast('✓ Şifre başarıyla güncellendi!', 'success');
          pwdForm.reset();
          if (strengthEl) strengthEl.innerHTML = '';
        } else {
          showToast(result.error || 'Şifre değiştirilemedi', 'error');
        }
      } catch (err) {
        showToast('Bağlantı hatası!', 'error');
      }
    });
  }

  // --- Contact Messages Management ---
  const messagesContainer = document.getElementById('messagesContainer');
  
  async function loadMessages() {
    if (!messagesContainer) return;
    try {
      const res = await fetch('/admin/api/messages');
      const result = await res.json();
      if (result.success) {
        renderMessages(result.messages);
      }
    } catch (err) {
      messagesContainer.innerHTML = '<p style="color:var(--white-60);text-align:center;padding:20px">Mesajlar yüklenemedi.</p>';
    }
  }

  function renderMessages(messages) {
    if (!messagesContainer) return;
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div style="text-align:center;color:var(--white-60);padding:40px 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="opacity:0.3;margin-bottom:12px"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
          <p>Henüz mesaj yok</p>
        </div>`;
      return;
    }

    messagesContainer.innerHTML = messages.map(msg => `
      <div class="message-card ${msg.read ? '' : 'unread'}" data-id="${msg.id}" style="
        background:${msg.read ? 'rgba(255,255,255,0.02)' : 'rgba(131,197,190,0.08)'};
        border:1px solid ${msg.read ? 'var(--white-10)' : 'rgba(131,197,190,0.3)'};
        border-radius:10px;padding:16px;position:relative;cursor:pointer;
        transition:all 0.2s ease;
      ">
        ${!msg.read ? '<div style="position:absolute;top:12px;right:12px;width:8px;height:8px;background:#83C5BE;border-radius:50%"></div>' : ''}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <strong style="color:var(--white);font-size:0.95rem">${msg.name}</strong>
            <span style="color:var(--sprout);font-size:0.8rem;margin-left:8px">${msg.email}</span>
          </div>
          <span style="color:var(--white-60);font-size:0.75rem;white-space:nowrap">${formatDate(msg.date)}</span>
        </div>
        <div style="color:var(--sand);font-size:0.85rem;font-weight:600;margin-bottom:6px">${msg.subject}</div>
        <p style="color:var(--white-60);font-size:0.85rem;line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${msg.message}</p>
        <div style="display:flex;gap:8px;margin-top:12px">
          ${!msg.read ? `<button onclick="markMessageRead('${msg.id}')" style="padding:4px 12px;background:rgba(131,197,190,0.15);color:#83C5BE;border:1px solid rgba(131,197,190,0.3);border-radius:6px;cursor:pointer;font-size:0.75rem">✓ Okundu</button>` : ''}
          <button onclick="deleteMessage('${msg.id}')" style="padding:4px 12px;background:rgba(231,76,60,0.1);color:#e74c3c;border:1px solid rgba(231,76,60,0.3);border-radius:6px;cursor:pointer;font-size:0.75rem">🗑 Sil</button>
          <a href="mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}" style="padding:4px 12px;background:rgba(224,169,109,0.1);color:#E0A96D;border:1px solid rgba(224,169,109,0.3);border-radius:6px;font-size:0.75rem;text-decoration:none">↩ Yanıtla</a>
        </div>
      </div>
    `).join('');
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Global functions for inline handlers
  window.markMessageRead = async function(id) {
    try {
      await fetch(`/admin/api/messages/${id}/read`, { method: 'POST' });
      showToast('✓ Mesaj okundu olarak işaretlendi', 'success');
      loadMessages();
    } catch (err) {
      showToast('Hata oluştu', 'error');
    }
  };

  window.deleteMessage = async function(id) {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    try {
      await fetch(`/admin/api/messages/${id}`, { method: 'DELETE' });
      showToast('✓ Mesaj silindi', 'success');
      loadMessages();
    } catch (err) {
      showToast('Hata oluştu', 'error');
    }
  };

  // Refresh button
  const refreshBtn = document.getElementById('refreshMessages');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadMessages();
      showToast('🔄 Mesajlar yenilendi', 'success');
    });
  }

  // Test email button
  const testEmailBtn = document.getElementById('testEmailBtn');
  if (testEmailBtn) {
    testEmailBtn.addEventListener('click', async () => {
      testEmailBtn.disabled = true;
      testEmailBtn.textContent = '📤 Gönderiliyor...';
      try {
        const res = await fetch('/admin/api/test-email', { method: 'POST' });
        const result = await res.json();
        if (result.success) {
          showToast('✓ ' + result.message, 'success');
        } else {
          showToast('✗ ' + (result.error || 'Gönderilemedi'), 'error');
        }
      } catch (err) {
        showToast('Bağlantı hatası!', 'error');
      }
      testEmailBtn.disabled = false;
      testEmailBtn.textContent = '📤 Test Maili Gönder';
    });
  }

  // Auto-load messages if on contact page
  if (messagesContainer) {
    loadMessages();
  }

});
