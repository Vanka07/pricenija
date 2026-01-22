# 🇳🇬 PriceNija

**Nigerian Commodity Market Price Tracker**

Real-time agricultural commodity prices across Nigeria's major markets.

![PriceNija](https://img.shields.io/badge/PriceNija-Market%20Intelligence-10b981)
![React](https://img.shields.io/badge/React-18-61dafb)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)

---

## 📋 Overview

PriceNija is a web platform that aggregates and displays commodity prices from major Nigerian markets, helping farmers, traders, and consumers make informed decisions.

### Features

✅ **Real-time Price Tracking** - Daily price updates across 5 major markets  
✅ **18 Commodities** - Grains, legumes, vegetables, oils, and more  
✅ **Price Comparison** - Compare prices across markets instantly  
✅ **Historical Charts** - View price trends over time  
✅ **Watchlist** - Save and track your favorite commodities  
✅ **Admin Dashboard** - Easy price entry and management  
✅ **Mobile Responsive** - Works on all devices  

---

## 🏪 Tracked Markets

| Market | Location | Region | Specialty |
|--------|----------|--------|-----------|
| **Dawanau** | Kano | North-West | Largest grain market in West Africa |
| **Mile 12** | Lagos | South-West | Largest foodstuff market in Lagos |
| **Bodija** | Ibadan, Oyo | South-West | Major wholesale agricultural hub |
| **Ogbete Main** | Enugu | South-East | Largest market in South-East |
| **Wuse** | Abuja, FCT | North-Central | Federal Capital market hub |

---

## 🌾 Tracked Commodities

### Grains
- Maize (White & Yellow)
- Rice (Local & Foreign)
- Sorghum
- Millet

### Legumes
- Beans (Brown & White)
- Soybeans
- Groundnut
- Cowpea

### Processed
- Garri (White & Yellow)

### Tubers
- Yam

### Vegetables
- Tomatoes
- Pepper (Rodo)
- Onions

### Oils
- Palm Oil

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or Supabase account)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pricenija.git
cd pricenija
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

#### Option A: Using Supabase (Recommended)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the contents of `database-schema.sql`
4. Copy your project URL and anon key

#### Option B: Local PostgreSQL

```bash
psql -U postgres -d pricenija -f database-schema.sql
```

### 4. Configure Environment Variables

Create a `.env.local` file:

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Or for local PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/pricenija

# App Config
NEXT_PUBLIC_APP_NAME=PriceNija
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
pricenija/
├── public-site.jsx         # Main public website component
├── admin-dashboard.jsx     # Admin panel component
├── database-schema.sql     # PostgreSQL database schema
├── README.md              # This file
└── (additional files when using Next.js)
    ├── app/
    │   ├── page.tsx       # Home page
    │   ├── admin/
    │   │   └── page.tsx   # Admin dashboard
    │   └── api/
    │       └── prices/
    │           └── route.ts
    ├── components/
    ├── lib/
    │   └── supabase.ts
    └── package.json
```

---

## 🔧 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

### Deploy to Other Platforms

The app can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

---

## 📊 API Endpoints (When using Next.js)

### Get Prices
```
GET /api/prices
GET /api/prices?commodity=maize-white
GET /api/prices?market=dawanau
GET /api/prices?date=2024-01-22
```

### Get Commodities
```
GET /api/commodities
GET /api/commodities/:slug
```

### Get Markets
```
GET /api/markets
GET /api/markets/:id
```

### Submit Price (Admin)
```
POST /api/prices
{
  "commodity_id": "uuid",
  "market_id": "uuid",
  "price": 75000,
  "date": "2024-01-22"
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Next.js 14 |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Database | PostgreSQL / Supabase |
| Hosting | Vercel |

---

## 📱 Future Roadmap

- [ ] SMS Price Alerts
- [ ] USSD Access (*123*PRICE#)
- [ ] WhatsApp Bot Integration
- [ ] Mobile App (React Native)
- [ ] Price Prediction (AI/ML)
- [ ] Multi-language Support (Hausa, Yoruba, Igbo)
- [ ] Expanded Market Coverage
- [ ] Public API Access

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

- **Website**: [pricenija.ng](https://pricenija.ng)
- **Email**: hello@pricenija.ng
- **Twitter**: [@pricenija](https://twitter.com/pricenija)

---

## 🙏 Acknowledgments

- Data sourced from major Nigerian markets
- Inspired by FEWS NET price monitoring
- Built with ❤️ for Nigerian farmers and traders

---

**Made in Nigeria 🇳🇬**
