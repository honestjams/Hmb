import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import RatingModal from './RatingModal'

function styleAccentColor(style) {
  if (!style) return '#78350f'
  const s = style.toLowerCase()
  if (s.includes('stout') || s.includes('porter')) return '#1a0800'
  if (s.includes('ipa') || s.includes('xpa')) return '#9a3412'
  if (s.includes('pale ale') || s.includes('session')) return '#b45309'
  if (s.includes('hefeweizen') || s.includes('wit')) return '#b45309'
  if (s.includes('lager') || s.includes('pilsner')) return '#d97706'
  if (s.includes('tripel') || s.includes('quad') || s.includes('dubbel') || s.includes('belgian')) return '#5b21b6'
  if (s.includes('sour') || s.includes('gose')) return '#065f46'
  return '#92400e'
}

export default function MyRatings({ session }) {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  async function fetchRatings() {
    const { data } = await supabase
      .from('ratings')
      .select('*, beers(name, brewery, style, abv, country, description)')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
    setRatings(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRatings() }, [session.user.id])

  async function openModal(rating) {
    const { data } = await supabase
      .from('beers_with_stats')
      .select('*')
      .eq('id', rating.beer_id)
      .single()
    if (data) setSelected(data)
  }

  if (loading) return <div className="loading">Loading your ratings…</div>

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">My Ratings</h1>
        {ratings.length > 0 && <span className="page-count">{ratings.length} beer{ratings.length !== 1 ? 's' : ''}</span>}
      </div>

      {ratings.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div className="empty-text">No ratings yet</div>
          <div className="empty-sub">Head to Browse and rate your first beer</div>
        </div>
      ) : (
        <div className="diary-list">
          {ratings.map(r => (
            <div key={r.id} className="diary-row" onClick={() => openModal(r)}>
              <div className="diary-accent" style={{ background: styleAccentColor(r.beers?.style) }} />
              <div className="diary-body">
                <div className="diary-name">{r.beers?.name}</div>
                <div className="diary-brewery">{r.beers?.brewery} · {r.beers?.style}</div>
                {r.comment && <div className="diary-comment">"{r.comment}"</div>}
              </div>
              <div className="diary-right">
                <div className="diary-stars">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} className={`diary-star ${n <= r.rating ? 'on' : ''}`}>★</span>
                  ))}
                </div>
                <div className="diary-date">
                  {new Date(r.updated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <RatingModal
          beer={selected}
          session={session}
          onClose={() => setSelected(null)}
          onSaved={fetchRatings}
        />
      )}
    </>
  )
}
