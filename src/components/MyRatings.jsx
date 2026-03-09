import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Stars from './Stars'
import RatingModal from './RatingModal'

export default function MyRatings({ session }) {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  async function fetchRatings() {
    const { data } = await supabase
      .from('ratings')
      .select('*, beers(name, brewery, style, abv, country, description, avg_rating:id)')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
    setRatings(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRatings() }, [session.user.id])

  async function fetchBeerWithStats(beerId) {
    const { data } = await supabase
      .from('beers_with_stats')
      .select('*')
      .eq('id', beerId)
      .single()
    return data
  }

  async function openModal(rating) {
    const beer = await fetchBeerWithStats(rating.beer_id)
    if (beer) setSelected(beer)
  }

  if (loading) return <div className="loading">Loading your ratings...</div>

  return (
    <>
      <h1 className="page-title">My Ratings</h1>

      {ratings.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          You have not rated any beers yet. Go browse and rate some!
        </div>
      ) : (
        <div className="history-list">
          {ratings.map(r => (
            <div key={r.id} className="history-card">
              <div className="history-card-body">
                <div className="history-beer-name">{r.beers?.name}</div>
                <div className="history-brewery">{r.beers?.brewery} &middot; {r.beers?.style}</div>
                <Stars value={r.rating} size="sm" />
                {r.comment && <div className="history-comment">"{r.comment}"</div>}
              </div>
              <div className="history-card-actions">
                <span className="history-date">
                  {new Date(r.updated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => openModal(r)}>Edit</button>
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
