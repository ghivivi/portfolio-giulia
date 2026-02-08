# Portfolio Giulia - Videomaker

Sito portfolio multilingua per una videomaker professionista, con design cinematografico scuro e layout verticale a galleria.

## 🌐 Lingue Supportate

- 🇮🇹 Italiano (`/it/`)
- 🇬🇧 English (`/en/`)
- 🇫🇷 Français (`/fr/`)

## 📁 Struttura Progetto

```
portfolio-giulia/
├── index.html              # Landing page con selettore lingua
├── css/
│   └── style.css          # CSS condiviso (tutte le lingue)
├── js/
│   └── script.js          # JavaScript condiviso
├── images/
│   └── portrait-placeholder.jpg
├── it/
│   └── index.html         # Versione italiana
├── en/
│   └── index.html         # Versione inglese
└── fr/
    └── index.html         # Versione francese
```

## 🎨 Design System

### Palette Colori
- **Background**: `#0a0a0a` (nero quasi puro)
- **Elevated BG**: `#141414` (card, nav)
- **Text**: `#e0d5c1` (bianco caldo)
- **Text Muted**: `#8a8278`
- **Accent**: `#c9a96e` (oro)

### Tipografia
- **Heading**: Cormorant Garamond (serif cinematografico)
- **Body**: Outfit (sans-serif moderno)

## ✨ Features

- 🎬 **Hero section** con video background fullscreen
- 📹 **Portfolio grid** verticale con supporto YouTube/Vimeo/video locali
- 🎭 **Video modal** lightbox per riproduzione
- 🌍 **Multilingua** con language switcher
- 📱 **Responsive** con hamburger menu mobile
- ♿ **Accessible** con ARIA labels e navigazione tastiera
- 🎨 **Animazioni** fade-in on scroll con IntersectionObserver

## 🚀 Deploy

Il sito è configurato per **GitHub Pages**. Per deployare:

1. Commit e push delle modifiche
2. Vai su Settings → Pages
3. Seleziona branch `main` come source
4. Il sito sarà disponibile su `https://[username].github.io/portfolio-giulia/`

## 📝 Personalizzazione

### Aggiungere Video
1. Modifica `it/index.html`, `en/index.html`, `fr/index.html`
2. Per YouTube: `data-video-type="youtube" data-video-id="VIDEO_ID"`
3. Per Vimeo: `data-video-type="vimeo" data-video-id="VIDEO_ID"`
4. Per video locali: `data-video-type="local" data-video-src="../videos/file.mp4"`

### Modificare Contenuti
- **Testi**: Modifica direttamente gli HTML nelle cartelle lingua
- **Colori**: Modifica CSS custom properties in `css/style.css`
- **Email/Telefono**: Cerca `giulia@example.com` e `+39 000 000 0000`
- **Social links**: Modifica gli `href` nella sezione contatti

### Aggiungere Immagini
- Hero poster: `images/hero-poster.jpg` (1920x1080)
- Thumbnail progetti: `images/thumb-progetto-*.jpg` (16:9)
- Portrait: Sostituisci `images/portrait-placeholder.jpg`

## 🛠️ Tech Stack

- **HTML5** semantico
- **CSS3** con custom properties e Grid/Flexbox
- **Vanilla JavaScript** (no framework)
- **Google Fonts** (Cormorant Garamond + Outfit)

## 📄 Licenza

© 2026 Giulia. Tutti i diritti riservati.
