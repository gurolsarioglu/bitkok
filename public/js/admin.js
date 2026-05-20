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
});
