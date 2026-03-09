import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Stars from './Stars'

const LABELS = ['', 'Not for me', 'Meh', 'Decent', 'Really good', 'Outstanding!']

export default function RatingModal({ beer, session, onClose, onSaved }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [existing, setExisting] = useState(null)

  useEffect(() => {
    async function loadExisting() {
      const { data } = await supabase
        .from('ratings')
        .select('*')
        .eq('beer_id', beer.id)
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (data) {
        setExisting(data)
        setRating(data.rating)
        setComment(data.comment || '')
      }
    }
    loadExisting()
  }, [beer.id, session.user.id])

  async function handleSave() {
    if (!rating) { setError('Please select a star rating.'); return }
    setLoading(true)
    setError('')
    const payload = { beer_id: beer.id, user_id: session.user.id, rating, comment }
    const { error } = existing
      ? await supabase.from('ratings').update({ rating, comment, updated_at: new Date().toISOString() }).eq('id', existing.id)
      : await supabase.from('ratings').insert(payload)
    setLoading(false)
    if (error) { setError(error.message); return }
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!existing) return
    setDeleting(true)
    await supabase.from('ratings').delete().eq('id', existing.id)
    setDeleting(false)
    onSaved()
    onClose()
  }

  const display = hover || rating

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{beer.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-beer-info">
          <div className="modal-brewery">{beer.brewery}</div>
          {beer.description && <p className="modal-desc">{beer.description}</p>}
          <div className="modal-tags">
            <span className="modal-tag">🍺 {beer.style}</span>
            {beer.abv && <span className="modal-tag">💧 {beer.abv}% ABV</span>}
            {beer.country && <span className="modal-tag">🌍 {beer.country}</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Community rating: <strong style={{ color: 'var(--gold)' }}>{Number(beer.avg_rating || 0).toFixed(1)} ★</strong> ({beer.rating_count || 0} ratings)
          </div>
        </div>

        <div className="rating-section">
          <h3>{existing ? 'Update your rating' : 'Rate this beer'}</h3>
          {error && <div className="error-msg">{error}</div>}

          <div className="rating-label">
            {display ? `${display}/5 — ${LABELS[display]}` : 'Select a rating'}
          </div>

          <div className="star-input">
            {[1,2,3,4,5].map(n => (
              <span
                key={n}
                className={`star interactive lg ${n <= display ? 'filled' : ''}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
              >★</span>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Comment (optional)</label>
            <textarea
              className="comment-area"
              placeholder="What did you think? Tasting notes, when you drank it, who with..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="rating-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : existing ? 'Update Rating' : 'Save Rating'}
            </button>
            {existing && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? '...' : 'Remove'}
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
