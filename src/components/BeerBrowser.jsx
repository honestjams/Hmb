import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import Stars from './Stars'
import RatingModal from './RatingModal'

const STYLES = ['All', 'Pale Lager', 'Pale Ale', 'American Pale Ale', 'American IPA', 'XPA', 'Double IPA', 'Session IPA', 'Hefeweizen', 'Witbier', 'Belgian Strong Pale Ale', 'Belgian Pale Ale', 'Dubbel', 'Tripel', 'Belgian Quad', 'Belgian Strong Dark Ale', 'English Bitter', 'English Brown Ale', 'English Strong Ale', 'Sweet Stout', 'Irish Dry Stout', 'Dry Stout', 'Imperial Stout', 'Czech Pilsner', 'Euro Pale Lager', 'Italian Lager', 'Vienna Lager', 'Schwarzbier', 'Doppelbock', 'Marzen', 'Steam Beer', 'Sparkling Ale']

export default function BeerBrowser({ session }) {
  const [beers, setBeers] = useState([])
  const [myRatings, setMyRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [styleFilter, setStyleFilter] = useState('All')
  const [selected, setSelected] = useState(null)

  const fetchBeers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('beers_with_stats')
      .select('*')
      .order('name')

    if (search) query = query.or(`name.ilike.%${search}%,brewery.ilike.%${search}%,style.ilike.%${search}%`)
    if (styleFilter !== 'All') query = query.eq('style', styleFilter)

    const { data } = await query
    setBeers(data || [])
    setLoading(false)
  }, [search, styleFilter])

  async function fetchMyRatings() {
    const { data } = await supabase
      .from('ratings')
      .select('beer_id, rating')
      .eq('user_id', session.user.id)
    const map = {}
    ;(data || []).forEach(r => { map[r.beer_id] = r.rating })
    setMyRatings(map)
  }

  useEffect(() => { fetchBeers() }, [fetchBeers])
  useEffect(() => { fetchMyRatings() }, [session.user.id])

  function onSaved() {
    fetchBeers()
    fetchMyRatings()
  }

  return (
    <>
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search beers, breweries or styles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="filters">
        {STYLES.map(s => (
          <button key={s} className={`filter-btn ${styleFilter === s ? 'active' : ''}`} onClick={() => setStyleFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading beers...</div>
      ) : beers.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🍺</div>
          No beers found. Try a different search or <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStyleFilter('All') }}>clear filters</button>
        </div>
      ) : (
        <div className="beer-grid">
          {beers.map(beer => (
            <div key={beer.id} className="beer-card" onClick={() => setSelected(beer)}>
              <div className="beer-card-header">
                <div>
                  <div className="beer-name">{beer.name}</div>
                  <div className="beer-brewery">{beer.brewery}</div>
                </div>
                <span className={`beer-badge ${beer.is_user_submitted ? 'user-submitted' : ''}`}>
                  {beer.is_user_submitted ? 'Community' : beer.style}
                </span>
              </div>

              <div className="beer-meta">
                {beer.abv && <span>💧 {beer.abv}%</span>}
                {beer.country && <span>🌍 {beer.country}</span>}
                {beer.is_user_submitted && <span>🍺 {beer.style}</span>}
              </div>

              <div className="beer-card-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Stars value={Math.round(beer.avg_rating || 0)} size="sm" />
                  <span className="avg-rating">
                    {Number(beer.avg_rating || 0).toFixed(1)} ({beer.rating_count || 0})
                  </span>
                </div>
                {myRatings[beer.id] && (
                  <span className="your-rating-badge">You: {myRatings[beer.id]}★</span>
                )}
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
          onSaved={onSaved}
        />
      )}
    </>
  )
}
