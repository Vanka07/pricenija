-- ============================================
-- PRICENIJA DATABASE SCHEMA
-- Nigerian Commodity Market Price Tracker
-- ============================================

-- Enable UUID extension (for PostgreSQL/Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MARKETS TABLE
-- Stores information about tracked markets
-- ============================================
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL CHECK (region IN ('North-West', 'North-East', 'North-Central', 'South-West', 'South-East', 'South-South')),
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMODITIES TABLE
-- Stores information about tracked commodities
-- ============================================
CREATE TABLE commodities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Grains', 'Legumes', 'Processed', 'Tubers', 'Vegetables', 'Oils', 'Other')),
    unit VARCHAR(50) NOT NULL,
    icon VARCHAR(10),
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRICES TABLE
-- Stores daily price entries
-- ============================================
CREATE TABLE prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commodity_id UUID NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
    price_type VARCHAR(20) DEFAULT 'wholesale' CHECK (price_type IN ('wholesale', 'retail')),
    date DATE NOT NULL,
    notes TEXT,
    submitted_by UUID,
    verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one price per commodity per market per date per type
    UNIQUE(commodity_id, market_id, date, price_type)
);

-- ============================================
-- USERS TABLE
-- For admin and data collectors
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'collector', 'user')),
    avatar_url TEXT,
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WATCHLIST TABLE
-- User's saved commodities
-- ============================================
CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commodity_id UUID NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, commodity_id)
);

-- ============================================
-- PRICE ALERTS TABLE
-- User price notifications
-- ============================================
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commodity_id UUID NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    target_price DECIMAL(12, 2) NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('above', 'below')),
    notification_method VARCHAR(20) DEFAULT 'email' CHECK (notification_method IN ('email', 'sms', 'push')),
    active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Prices indexes
CREATE INDEX idx_prices_commodity_id ON prices(commodity_id);
CREATE INDEX idx_prices_market_id ON prices(market_id);
CREATE INDEX idx_prices_date ON prices(date);
CREATE INDEX idx_prices_date_desc ON prices(date DESC);
CREATE INDEX idx_prices_commodity_market_date ON prices(commodity_id, market_id, date);

-- Markets indexes
CREATE INDEX idx_markets_active ON markets(active);
CREATE INDEX idx_markets_region ON markets(region);

-- Commodities indexes
CREATE INDEX idx_commodities_active ON commodities(active);
CREATE INDEX idx_commodities_category ON commodities(category);
CREATE INDEX idx_commodities_slug ON commodities(slug);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Watchlist indexes
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);

-- Price alerts indexes
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(active);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_markets_updated_at
    BEFORE UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commodities_updated_at
    BEFORE UPDATE ON commodities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prices_updated_at
    BEFORE UPDATE ON prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: MARKETS
-- ============================================
INSERT INTO markets (name, city, state, region, description) VALUES
('Dawanau', 'Kano', 'Kano', 'North-West', 'Largest grain market in West Africa'),
('Mile 12', 'Lagos', 'Lagos', 'South-West', 'Largest foodstuff market in Lagos'),
('Bodija', 'Ibadan', 'Oyo', 'South-West', 'Major wholesale agricultural hub'),
('Ogbete Main', 'Enugu', 'Enugu', 'South-East', 'Largest market in South-East Nigeria'),
('Wuse', 'Abuja', 'FCT', 'North-Central', 'Federal Capital market hub');

-- ============================================
-- SEED DATA: COMMODITIES
-- ============================================
INSERT INTO commodities (name, slug, category, unit, icon) VALUES
-- Grains
('Maize (White)', 'maize-white', 'Grains', 'per 100kg bag', '🌽'),
('Maize (Yellow)', 'maize-yellow', 'Grains', 'per 100kg bag', '🌽'),
('Rice (Local)', 'rice-local', 'Grains', 'per 50kg bag', '🍚'),
('Rice (Foreign)', 'rice-foreign', 'Grains', 'per 50kg bag', '🍚'),
('Sorghum', 'sorghum', 'Grains', 'per 100kg bag', '🌾'),
('Millet', 'millet', 'Grains', 'per 100kg bag', '🌾'),
-- Legumes
('Beans (Brown)', 'beans-brown', 'Legumes', 'per 100kg bag', '🫘'),
('Beans (White)', 'beans-white', 'Legumes', 'per 100kg bag', '🫘'),
('Soybeans', 'soybeans', 'Legumes', 'per 100kg bag', '🫛'),
('Groundnut', 'groundnut', 'Legumes', 'per 100kg bag', '🥜'),
('Cowpea', 'cowpea', 'Legumes', 'per 100kg bag', '🫘'),
-- Processed
('Garri (White)', 'garri-white', 'Processed', 'per 50kg bag', '🥣'),
('Garri (Yellow)', 'garri-yellow', 'Processed', 'per 50kg bag', '🥣'),
-- Tubers
('Yam', 'yam', 'Tubers', 'per tuber', '🍠'),
-- Vegetables
('Tomatoes', 'tomatoes', 'Vegetables', 'per 50kg basket', '🍅'),
('Pepper (Rodo)', 'pepper-rodo', 'Vegetables', 'per 50kg basket', '🌶️'),
('Onions', 'onions', 'Vegetables', 'per 100kg bag', '🧅'),
-- Oils
('Palm Oil', 'palm-oil', 'Oils', 'per 25 liters', '🫒');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Latest prices view
CREATE VIEW latest_prices AS
SELECT DISTINCT ON (p.commodity_id, p.market_id)
    p.id,
    p.commodity_id,
    c.name as commodity_name,
    c.category,
    c.unit,
    c.icon,
    p.market_id,
    m.name as market_name,
    m.city,
    m.state,
    m.region,
    p.price,
    p.price_type,
    p.date,
    p.created_at
FROM prices p
JOIN commodities c ON p.commodity_id = c.id
JOIN markets m ON p.market_id = m.id
WHERE c.active = true AND m.active = true
ORDER BY p.commodity_id, p.market_id, p.date DESC;

-- Price statistics view
CREATE VIEW price_statistics AS
SELECT 
    commodity_id,
    market_id,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price,
    COUNT(*) as total_records,
    MAX(date) as last_update
FROM prices
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY commodity_id, market_id;

-- ============================================
-- ROW LEVEL SECURITY (for Supabase)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Public read access for markets and commodities
CREATE POLICY "Public read access for markets"
    ON markets FOR SELECT
    USING (active = true);

CREATE POLICY "Public read access for commodities"
    ON commodities FOR SELECT
    USING (active = true);

CREATE POLICY "Public read access for prices"
    ON prices FOR SELECT
    USING (true);

-- Admin policies (adjust based on your auth setup)
CREATE POLICY "Admin full access for markets"
    ON markets FOR ALL
    USING (true); -- Adjust with proper auth check

CREATE POLICY "Admin full access for commodities"
    ON commodities FOR ALL
    USING (true); -- Adjust with proper auth check

CREATE POLICY "Admin full access for prices"
    ON prices FOR ALL
    USING (true); -- Adjust with proper auth check

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get latest prices for all commodities in a specific market
-- SELECT * FROM latest_prices WHERE market_name = 'Dawanau';

-- Get price trend for a commodity over last 30 days
-- SELECT date, AVG(price) as avg_price
-- FROM prices
-- WHERE commodity_id = 'your-commodity-uuid'
-- AND date >= CURRENT_DATE - INTERVAL '30 days'
-- GROUP BY date
-- ORDER BY date;

-- Get cheapest market for a commodity
-- SELECT market_name, city, price
-- FROM latest_prices
-- WHERE commodity_name = 'Maize (White)'
-- ORDER BY price ASC
-- LIMIT 1;

-- Get price comparison across markets
-- SELECT market_name, city, region, price
-- FROM latest_prices
-- WHERE commodity_name = 'Rice (Local)'
-- ORDER BY price ASC;
