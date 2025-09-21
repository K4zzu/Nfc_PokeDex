# PokéNFC Dex (React + Vite + Web NFC)

Una **Pokédex** que permite **escanear tags NFC** para registrar y visualizar Pokémon. Soporta lectura de **texto/URL** en NDEF, mapeo por **serial del tag**, apertura por **URL directa** (`/pokemon/:id`) y una UI temática con animaciones, sonidos y guardado en `localStorage`.

> ✅ Probado en **Chrome/Edge Android** (Web NFC requiere **HTTPS** o `http://localhost`).  
> ⚠️ iOS no soporta Web NFC en navegador. Para abrir desde el tag, programa una **URL** y la app reaccionará al cargar.

---

## ✨ Características

- **Escaneo NFC** (Web NFC + NDEF)
- Registrar Pokémon por:
  - **Texto** en el tag (e.g., `POKEMON:25`, `25`, `id=25`)
  - **URL** en el tag (e.g., `https://tuapp.com/pokemon/25`)
  - **Serial del tag** (mapa `SERIAL_TO_POKEMON`)
- **Modal** con datos (nombre, tipos, altura, peso, stats) vía **PokeAPI**
- **Scroll automático** y **resaltado** al capturar
- **Búsqueda** por nombre/ID (con autodesplazamiento a la tarjeta)
- **Paginación** (20 por página por defecto)
- **Persistencia** en `localStorage`
- **UI Pokémon-like**: luces, botones, animaciones, sonidos (base64 placeholders)
- **Accesible**: tarjetas clicables con teclado (Enter/Espacio), labels y roles adecuados

---

## 🖼️ Vista Previa

_(Inserta aquí un GIF o capturas: escaneo NFC → modal → scroll, búsqueda por nombre, apertura por URL `/pokemon/25`)_

---

## 🧱 Stack

- **React + Vite**
- **Tailwind CSS** (con utilidades personalizadas)
- **PokeAPI** (sprites + datos)
- **Web NFC** (Chrome/Edge Android)
- **localStorage** (progreso y caché ligera)

---

## 🚀 Puesta en marcha

### Requisitos
- Node.js 18+ y npm
- Android con Chrome/Edge para pruebas NFC (HTTPS o `localhost`)
- Certificado HTTPS si pruebas en red (puedes usar **ngrok**, **Cloudflared** o **vite-plugin-basic-ssl**)

### Instalación
```bash
npm install
