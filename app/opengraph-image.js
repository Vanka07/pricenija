import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PriceNija - Nigerian Commodity Market Price Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #030712 0%, #064e3b 50%, #030712 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #4ade80, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            ₦
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: '64px', fontWeight: 'bold', color: 'white' }}>
              Price
            </span>
            <span style={{ fontSize: '64px', fontWeight: 'bold', color: '#4ade80' }}>
              Nija
            </span>
          </div>
        </div>
        <p
          style={{
            fontSize: '28px',
            color: '#9ca3af',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Track real-time agricultural commodity prices across Nigeria&apos;s top markets
        </p>
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '40px',
          }}
        >
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#4ade80' }}>18+</span>
            <span style={{ fontSize: '16px', color: '#6b7280' }}>Commodities</span>
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#60a5fa' }}>5+</span>
            <span style={{ fontSize: '16px', color: '#6b7280' }}>Markets</span>
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#fbbf24' }}>Live</span>
            <span style={{ fontSize: '16px', color: '#6b7280' }}>Updates</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
