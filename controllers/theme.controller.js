const contentModel = require('../models/content.model');

/**
 * Dinamik tema CSS'i oluşturur.
 * Admin panelinden yapılan design değişiklikleri burada CSS custom properties'e dönüştürülür.
 */
exports.generateThemeCSS = (req, res) => {
  const content = contentModel.getAll();
  const d = content.design || {};
  const fonts = d.fonts || {};
  const colors = d.colors || {};
  const typo = d.typography || {};
  const spacing = d.spacing || {};
  const borders = d.borders || {};
  const effects = d.effects || {};

  // Google Fonts URL oluştur
  const fontFamilies = [
    fonts.heading, fonts.body, fonts.logo
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  
  const googleFontsUrl = `https://fonts.googleapis.com/css2?${
    fontFamilies.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700;800`).join('&')
  }&display=swap`;

  const css = `/* Bitkok Dynamic Theme — Auto-generated from Admin Panel */
@import url('${googleFontsUrl}');

:root {
  /* === FONTS === */
  --font-heading: '${fonts.heading || 'Playfair Display'}', Georgia, serif;
  --font-body: '${fonts.body || 'Inter'}', -apple-system, sans-serif;
  --font-logo: '${fonts.logo || 'Montserrat'}', sans-serif;
  --font-heading-weight: ${fonts.headingWeight || '700'};
  --font-body-weight: ${fonts.bodyWeight || '400'};
  --font-logo-weight: ${fonts.logoWeight || '700'};

  /* === COLORS === */
  --tech-navy: ${colors.primary || '#1B263B'};
  --digital-olive: ${colors.secondary || '#4F6D7A'};
  --bio-sprout: ${colors.accent || '#83C5BE'};
  --warm-sand: ${colors.highlight || '#E0A96D'};
  --navy-dark: ${colors.primaryDark || '#0F1A2B'};
  --navy-light: #2A3A52;

  --text-heading: ${colors.textHeading || '#FFFFFF'};
  --text-body: ${colors.textBody || 'rgba(255,255,255,0.8)'};
  --text-muted: ${colors.textMuted || 'rgba(255,255,255,0.6)'};
  --text-link: ${colors.textLink || '#83C5BE'};

  --bg-main: ${colors.bgMain || '#1B263B'};
  --bg-dark: ${colors.bgDark || '#0F1A2B'};
  --bg-card: ${colors.bgCard || 'rgba(255,255,255,0.03)'};
  --bg-card-hover: ${colors.bgCardHover || 'rgba(255,255,255,0.06)'};
  --border-color: ${colors.borderColor || 'rgba(255,255,255,0.1)'};

  --btn-primary-bg: ${colors.btnPrimaryBg || '#E0A96D'};
  --btn-primary-text: ${colors.btnPrimaryText || '#1B263B'};
  --btn-secondary-bg: ${colors.btnSecondaryBg || 'transparent'};
  --btn-secondary-text: ${colors.btnSecondaryText || '#83C5BE'};
  --btn-secondary-border: ${colors.btnSecondaryBorder || '#83C5BE'};

  --section-label-color: ${colors.sectionLabelColor || '#83C5BE'};
  --counter-color: ${colors.counterColor || '#83C5BE'};
  --footer-bg: ${colors.footerBg || '#0F1A2B'};

  /* === TYPOGRAPHY === */
  --base-font-size: ${typo.baseFontSize || '16'}px;
  --h1-size: ${typo.h1Size || '3.5'}rem;
  --h2-size: ${typo.h2Size || '2.8'}rem;
  --h3-size: ${typo.h3Size || '1.2'}rem;
  --body-size: ${typo.bodySize || '1'}rem;
  --line-height: ${typo.lineHeight || '1.6'};
  --heading-line-height: ${typo.headingLineHeight || '1.1'};
  --letter-spacing: ${typo.letterSpacing || '0'}px;
  --heading-letter-spacing: ${typo.headingLetterSpacing || '1'}px;
  --heading-transform: ${typo.headingTransform || 'uppercase'};
  --nav-font-size: ${typo.navFontSize || '0.9'}rem;
  --label-letter-spacing: ${typo.labelLetterSpacing || '3'}px;

  /* === SPACING === */
  --container-width: ${spacing.containerMaxWidth || '1200'}px;
  --section-padding: ${spacing.sectionPaddingY || '100'}px 0;
  --card-padding: ${spacing.cardPadding || '36'}px;
  --gap: ${spacing.gap || '24'}px;
  --navbar-height: ${spacing.navbarHeight || '70'}px;

  /* === BORDERS === */
  --radius-sm: ${borders.radiusSmall || '8'}px;
  --radius-md: ${borders.radiusMedium || '12'}px;
  --radius-lg: ${borders.radiusLarge || '20'}px;
  --radius-full: ${borders.radiusButton || '50'}px;
  --card-border-width: ${borders.cardBorderWidth || '1'}px;

  /* === EFFECTS === */
  --transition-base: ${effects.transitionSpeed || '0.3'}s ease;
  --transition-fast: 0.2s ease;
  --transition-slow: 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  --hover-scale: ${effects.hoverScale || '1.05'};
  --card-hover-lift: ${effects.cardHoverLift || '6'}px;
  --shadow-intensity: ${effects.shadowIntensity || '0.3'};
  --glass-blur: ${effects.glassBlur || '20'}px;
  --glass-opacity: ${effects.glassOpacity || '0.92'};
  --gradient-angle: ${effects.gradientAngle || '135'}deg;

  /* Derived */
  --sprout-glow: rgba(131, 197, 190, 0.15);
  --white: #FFFFFF;
  --white-80: ${colors.textBody || 'rgba(255,255,255,0.8)'};
  --white-60: ${colors.textMuted || 'rgba(255,255,255,0.6)'};
  --white-10: ${colors.borderColor || 'rgba(255,255,255,0.1)'};
  --white-05: ${colors.bgCard || 'rgba(255,255,255,0.03)'};
}

/* === Apply Design Tokens === */
html { font-size: var(--base-font-size); }
body { font-family: var(--font-body); font-weight: var(--font-body-weight); background: var(--bg-main); color: var(--text-body); line-height: var(--line-height); }
.container { max-width: var(--container-width); }

.hero__title, .section-title { font-family: var(--font-heading); font-weight: var(--font-heading-weight); color: var(--text-heading); text-transform: var(--heading-transform); letter-spacing: var(--heading-letter-spacing); }
.hero__title { font-size: var(--h1-size); line-height: var(--heading-line-height); }
.hero__title span { color: var(--bio-sprout); }
.section-title { font-size: var(--h2-size); }
.hero__subtitle, .story__text { color: var(--text-body); }
.section-desc, .solution-card__desc, .blog-card__excerpt, .timeline__desc { color: var(--text-muted); }
.section-label { color: var(--section-label-color); letter-spacing: var(--label-letter-spacing); }
.navbar__logo-text { font-family: var(--font-logo); font-weight: var(--font-logo-weight); }
.navbar__links a { font-size: var(--nav-font-size); }
.stat-item__number { color: var(--counter-color); font-family: var(--font-logo); }

.hero { background: linear-gradient(var(--gradient-angle), var(--bg-dark) 0%, var(--bg-main) 50%, #1e3a2f 100%); }
.solutions, .blog { background: var(--bg-main); }
.story { background: linear-gradient(180deg, var(--bg-main) 0%, var(--bg-dark) 100%); }
.research { background: var(--bg-dark); }
.footer { background: var(--footer-bg); }

.navbar.scrolled { background: rgba(27, 38, 59, var(--glass-opacity)); backdrop-filter: blur(var(--glass-blur)); }

.solution-card, .blog-card, .stat-item, .hero__info-item, .contact__form, .timeline__content {
  background: var(--bg-card);
  border: var(--card-border-width) solid var(--border-color);
  border-radius: var(--radius-lg);
}
.solution-card { padding: var(--card-padding) calc(var(--card-padding) - 8px); }
.solution-card:hover, .blog-card:hover { 
  background: var(--bg-card-hover); 
  transform: translateY(calc(var(--card-hover-lift) * -1));
  border-color: rgba(131,197,190,0.3);
}

.btn--primary { background: var(--btn-primary-bg); color: var(--btn-primary-text); border-radius: var(--radius-full); }
.btn--secondary { background: var(--btn-secondary-bg); color: var(--btn-secondary-text); border: 2px solid var(--btn-secondary-border); }

.solutions__grid, .blog__grid { gap: var(--gap); }
`;

  res.set('Content-Type', 'text/css');
  res.set('Cache-Control', 'no-cache');
  res.send(css);
};
