import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const LABELS = ['', "Not for me", "It's alright", 'Pretty decent', 'Really good', 'Outstanding!']

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
    if (!rating) { setError('Select a star rating first.'); return }
    setLoading(true)
    setError('')
    const { error } = existing
      ? await supabase.from('ratings').update({ rating, comment, updated_at: new Date().toISOString() }).eq('id', existing.id)
      : await supabase.from('ratings').insert({ beer_id: beer.id, user_id: session.user.id, rating, comment })
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
        <div className="modal-handle" />

        <div className="modal-top">
          <div>
            <div className="modal-name">{beer.name}</div>
            <div className="modal-brewery">{beer.brewery}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tags">
          <span className="modal-tag">🍺 {beer.style}</span>
          {beer.abv && <span className="modal-tag">💧 {beer.abv}%</span>}
          {beer.country && <span className="modal-tag">🌍 {beer.country}</span>}
        </div>

        {beer.description && <p className="modal-desc">{beer.description}</p>}

        <div className="modal-community">
          Community: <strong>{Number(beer.avg_rating || 0).toFixed(1)} ★</strong> from {beer.rating_count || 0} rating{beer.rating_count !== 1 ? 's' : ''}
        </div>

        <div className="rate-heading">{existing ? 'Your rating' : 'Rate this beer'}</div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="stars-row">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              className={`star-btn ${n <= display ? 'on' : ''}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
            >★</button>
          ))}
        </div>

        <div className="star-label-text">
          {display ? <><strong>{display}/5</strong> — {LABELS[display]}</> : 'Tap a star'}
        </div>

        <textarea
          className="modal-textarea"
          placeholder="Tasting notes, where you had it, who with… (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={500}
        />

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : existing ? 'Update' : 'Save Rating'}
          </button>
          {existing && (
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? '…' : 'Remove'}
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
