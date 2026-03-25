# YKS Atlas — Vercel Deployment

## Dosyalar
- `public/index.html` — tek sayfalık uygulama
- `public/imgs/` — soru sayfaları (103 adet JPEG)
- `public/tytgeometri.pdf` — TYT Geometri kaynak PDF
- `public/aytmat.pdf` — AYT Matematik kaynak PDF

## Vercel'e Yükleme

### Yöntem 1 — Vercel CLI (tavsiye)
```bash
npm i -g vercel
cd yks-atlas
vercel --prod
```

### Yöntem 2 — Web Arayüzü
1. vercel.com → New Project → drag & drop `yks-atlas` klasörünü
2. Framework Preset: **Other**
3. Output Directory: `public`
4. Deploy!

## Not
Site tamamen statik — sunucu gerekmez. GitHub'a pushla, Vercel otomatik deploy eder.
