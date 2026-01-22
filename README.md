# 🇳🇬 PriceNija

**Nigerian Commodity Market Price Tracker**

Real-time agricultural commodity prices across Nigeria's major markets.

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Create a new repository on GitHub**
   - Go to github.com and create a new repository named `pricenija`

2. **Upload these files to GitHub**
   - Upload all files from this folder to your new repository

3. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and deploy

4. **Connect your domain**
   - In Vercel dashboard, go to Settings → Domains
   - Add `pricenija.com`
   - Update DNS in GoDaddy (instructions below)

### Option 2: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 🌐 Connect GoDaddy Domain to Vercel

### Step 1: Get Vercel DNS Records
After deploying, Vercel will give you one of these:
- **A Record**: `76.76.21.21`
- **CNAME**: `cname.vercel-dns.com`

### Step 2: Update GoDaddy DNS

1. Log in to GoDaddy
2. Go to "My Products" → Find your domain → "DNS"
3. Delete existing A and CNAME records for @ and www
4. Add new records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

5. Wait 5-30 minutes for DNS propagation

### Step 3: Verify in Vercel
- Go to your Vercel project → Settings → Domains
- Add `pricenija.com` and `www.pricenija.com`
- Vercel will verify and issue SSL certificate automatically

## 📁 Project Structure

```
pricenija-app/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.js        # Root layout with metadata
│   └── page.js          # Main page component
├── package.json         # Dependencies
├── next.config.js       # Next.js config
├── tailwind.config.js   # Tailwind config
├── postcss.config.js    # PostCSS config
└── .gitignore          # Git ignore file
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## ✨ Features

- 📊 Real-time price tracking
- 🏪 5 major Nigerian markets
- 🌾 18 commodities
- 📈 Price trend charts
- ⭐ Watchlist functionality
- 📱 Mobile responsive
- 🌙 Dark theme

## 🇳🇬 Markets Covered

- Dawanau (Kano)
- Mile 12 (Lagos)
- Bodija (Ibadan)
- Ogbete Main (Enugu)
- Wuse (Abuja)

## 📞 Support

Questions? Contact: hello@pricenija.com

---

**Made with ❤️ for Nigeria**
