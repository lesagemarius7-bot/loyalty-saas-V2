// An empty checkout receipt — the payoff object for "pas de carte, pas de
// points": a plain register ticket with line items but no loyalty line, and
// a blunt "AUCUN POINT FIDÉLITÉ" stamped at the bottom in place of one.
export function ReceiptStrip({ width = 190 }: { width?: number }) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        background: '#faf7f0',
        padding: '20px 18px 26px',
        boxShadow: '0 25px 45px rgba(0,0,0,0.35)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: -9,
          left: 0,
          right: 0,
          height: 18,
          background:
            'linear-gradient(135deg, transparent 50%, #faf7f0 50%) 0 0/9px 18px repeat-x, linear-gradient(-135deg, transparent 50%, #faf7f0 50%) 0 0/9px 18px repeat-x',
        }}
      />
      <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#3a2a16', textAlign: 'center', letterSpacing: 1.5 }}>
        SUSHI YAMA
      </p>
      <div style={{ margin: '10px 0', borderTop: '1px dashed #c7bba6' }} />
      {[
        ['Bento saumon', '12.90€'],
        ['Thé vert', '2.50€'],
      ].map(([label, price]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 10.5, color: '#8a7a60', marginBottom: 5 }}>
          <span>{label}</span>
          <span>{price}</span>
        </div>
      ))}
      <div style={{ margin: '10px 0', borderTop: '1px dashed #c7bba6' }} />
      <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: '#c4322f', textAlign: 'center', letterSpacing: 0.5 }}>
        AUCUN POINT FIDÉLITÉ
      </p>
    </div>
  )
}
