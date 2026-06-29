# ⚽ Ultimate Football Championship 3D 🏆

Realist 3D Veb Futbol O'yini (Three.js + Node.js Express).
Ushbu o'yin futbol ishqibozlari uchun maxsus yaratilgan bo'lib, yuqori darajadagi 3D grafika, burama (curve) zarbalar, darvozabon AI, dinamik sekinlashtirilgan (slow-mo) replaylar va haqiqiy stadion muhitini taqdim etadi!

---

## 🚀 GitHub va Render.com platformalarida 24/7 bepul ishlatish bo'yicha qo'llanma

O'yinni butun dunyo bo'ylab istalgan qurilmadan 24/7 bepul o'ynash uchun quyidagi 2 ta bosqichni bajaring:

### 1-bosqich: GitHub-ga yuklash (Push to GitHub)
1. **GitHub.com** saytida yangi repository oching (masalan: `my-3d-soccer-game`).
2. Kompyuteringizdagi ushbu loyiha papkasida terminalni ochib, quyidagi buyruqlarni ketma-ket kiriting:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ultimate 3D Soccer Game"
   git branch -M main
   git remote add origin https://github.com/SIZNING_USERNAME/my-3d-soccer-game.git
   git push -u origin main
   ```

### 2-bosqich: Render.com platformasida 24/7 bepul host qilish (Deploy to Render)
1. **[Render.com](https://render.com/)** saytiga kiring va o'z GitHub hisobingiz orqali ro'yxatdan o'ting.
2. Boshqaruv panelida **"New +"** tugmasini bosing va **"Web Service"** bandini tanlang.
3. GitHub-ga yuklagan `my-3d-soccer-game` repositoryingizni tanlang.
4. Quyidagi sozlamalarni kiriting:
   - **Name**: `my-soccer-game` (xohlagan nomingiz)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. **"Create Web Service"** tugmasini bosing! 
6. Taxminan 1 daqiqadan so'ng Render sizga `https://my-soccer-game.onrender.com` ko'rinishida 24/7 ishlaydigan bepul havolani taqdim etadi! 🎉

---

## 🎮 O'yin Boshqaruvi (Controls)
- **Shtrafnoy va Penalti rejimi**: 
  - Sichqoncha (sichqonchani bosib turib surish) yoki ekran orqali to'pni darvoza tomonga **teping**.
  - Zarbaga kavis (burama) berish uchun to'pni tekkandan so'ng Sichqonchani yon tomonga qayiring!
- **Arcade Match rejimi**:
  - **W, A, S, D** yoki **Yo'nalish tugmalari**: Futbolchini boshqarish.
  - **Space (Probel)**: Kuchli darvozaga zarba berish (Shoot).
  - **K (yoki Shift)**: Uzatma berish (Pass).

Boy tajriba va unutilmas futbol emotsiyalaridan bahramand bo'ling! ⚽🔥
