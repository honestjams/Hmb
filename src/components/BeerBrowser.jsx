import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import RatingModal from './RatingModal'

const STYLES = [
  'Pale Lager','Mid-strength Lager','Pale Ale','American Pale Ale','XPA',
  'American IPA','Double IPA','Session IPA','New England IPA',
  'Hefeweizen','Witbier','Sparkling Ale','Saison',
  'Belgian Pale Ale','Belgian Strong Pale Ale','Dubbel','Tripel','Belgian Quad','Belgian Strong Dark Ale',
  'English Bitter','English Brown Ale','English Strong Ale',
  'Irish Dry Stout','Dry Stout','Sweet Stout','Imperial Stout','Porter',
  'Czech Pilsner','German Pilsner','Euro Pale Lager','Italian Lager','Vienna Lager',
  'Schwarzbier','Doppelbock','Marzen','Steam Beer',
  'Sour Ale','Gose','Fruit Beer','Other',
]

const SORT_OPTIONS = [
  { value: 'name', label: 'Name A–Z' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Rated' },
  { value: 'newest', label: 'Newest' },
]

function styleAccentColor(style) {
  if (!style) return '#78350f'
  const s = style.toLowerCase()
  if (s.includes('stout') || s.includes('porter')) return '#1a0800'
  if (s.includes('imperial stout')) return '#0d0400'
  if (s.includes('double ipa') || s.includes('dipa')) return '#7c2d12'
  if (s.includes('ipa') || s.includes('xpa')) return '#9a3412'
  if (s.includes('pale ale') || s.includes('session')) return '#b45309'
  if (s.includes('hefeweizen') || s.includes('wit') || s.includes('wheat')) return '#b45309'
  if (s.includes('lager') || s.includes('pilsner')) return '#d97706'
  if (s.includes('tripel') || s.includes('quad') || s.includes('dubbel') || s.includes('belgian')) return '#5b21b6'
  if (s.includes('sour') || s.includes('gose')) return '#065f46'
  if (s.includes('schwarzbier') || s.includes('bock') || s.includes('dunkel')) return '#292524'
  if (s.includes('bitter') || s.includes('brown') || s.includes('english')) return '#7c2d12'
  return '#92400e'
}

export default function BeerBrowser({ session }) {
  const [beers, setBeers] = useState([])
  const [myRatings, setMyRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [styleFilter, setStyleFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [ratedTab, setRatedTab] = useState('all') // 'all' | 'rated' | 'unrated'
  const [selected, setSelected] = useState(null)

  const fetchBeers = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('beers_with_stats').select('*')

    if (search) query = query.or(`name.ilike.%${search}%,brewery.ilike.%${search}%,style.ilike.%${search}%`)
    if (styleFilter) query = query.eq('style', styleFilter)

    if (sortBy === 'rating') query = query.order('avg_rating', { ascending: false })
    else if (sortBy === 'popular') query = query.order('rating_count', { ascending: false })
    else if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
    else query = query.order('name')

    const { data } = await query
    setBeers(data || [])
    setLoading(false)
  }, [search, styleFilter, sortBy])

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

  function onSaved() { fetchBeers(); fetchMyRatings() }

  const displayed = beers.filter(b => {
    if (ratedTab === 'rated') return !!myRatings[b.id]
    if (ratedTab === 'unrated') return !myRatings[b.id]
    return true
  })

  return (
    <>
      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search beers, breweries, styles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            className={`filter-select ${styleFilter ? 'has-value' : ''}`}
            value={styleFilter}
            onChange={e => setStyleFilter(e.target.value)}
          >
            <option value="">All styles</option>
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="filter-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <div className="filter-tabs">
            <button className={`filter-tab ${ratedTab === 'all' ? 'active' : ''}`} onClick={() => setRatedTab('all')}>All</button>
            <button className={`filter-tab ${ratedTab === 'rated' ? 'active' : ''}`} onClick={() => setRatedTab('rated')}>Rated</button>
            <button className={`filter-tab ${ratedTab === 'unrated' ? 'active' : ''}`} onClick={() => setRatedTab('unrated')}>Unrated</button>
          </div>
        </div>
      </div>

      <div className="results-meta">
        {loading ? 'Loading…' : `${displayed.length} beer${displayed.length !== 1 ? 's' : ''}`}
        {(styleFilter || search) && !loading && (
          <button
            style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--amber)', fontSize: 12, cursor: 'pointer' }}
            onClick={() => { setSearch(''); setStyleFilter('') }}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading beers…</div>
      ) : displayed.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🍺</div>
          <div className="empty-text">No beers found</div>
          <div className="empty-sub">Try adjusting your filters</div>
        </div>
      ) : (
        <div className="beer-grid">
          {displayed.map(beer => {
            const accent = styleAccentColor(beer.style)
            const myRating = myRatings[beer.id]
            return (
              <div key={beer.id} className="beer-card" onClick={() => setSelected(beer)}>
                <div className="beer-card-accent" style={{ background: accent }} />
                <div className="beer-card-body">
                  <div className="beer-name">{beer.name}</div>
                  <div className="beer-brewery">{beer.brewery}</div>
                  <div className="beer-pills">
                    {beer.is_user_submitted
                      ? <span className="community-pill">Community</span>
                      : <span className="style-pill">{beer.style}</span>
                    }
                    {beer.country && <span className="style-pill">{beer.country}</span>}
                  </div>
                </div>
                <div className="beer-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} className={`card-star ${n <= Math.round(beer.avg_rating || 0) ? 'on' : ''}`}>★</span>
                    ))}
                    <span className="card-rating-count">
                      {Number(beer.avg_rating || 0).toFixed(1)} ({beer.rating_count || 0})
                    </span>
                  </div>
                  {myRating && <span className="your-badge">★ {myRating}</span>}
                </div>
              </div>
            )
          })}
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
