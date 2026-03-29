const items = ['Active recall','Gated progress','No autoplay','Spaced repetition','Summary writing','Streak tracking','Zero distractions','Proven retention']

export default function Ticker() {
  const all = [...items, ...items]
  return (
    <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '10px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 56, whiteSpace: 'nowrap', animation: 'ticker 28s linear infinite', width: 'max-content' }}>
        {all.map((t, i) => (
          <span key={i} className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}/>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
