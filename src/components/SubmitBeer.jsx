import { useState } from 'react'
import { supabase } from '../supabase'

const STYLES = [
  'Pale Lager','Mid-strength Lager','Pale Ale','American Pale Ale','XPA',
  'American IPA','Double IPA','Session IPA','New England IPA',
  'Hefeweizen','Witbier','Saison','Sparkling Ale',
  'Belgian Pale Ale','Belgian Strong Pale Ale','Dubbel','Tripel','Belgian Quad','Belgian Strong Dark Ale',
  'English Bitter','English Brown Ale','English Strong Ale',
  'Dry Stout','Irish Dry Stout','Sweet Stout','Imperial Stout','Porter',
  'Czech Pilsner','German Pilsner','Euro Pale Lager','Italian Lager','Vienna Lager',
  'Schwarzbier','Doppelbock','Marzen','Steam Beer',
  'Sour Ale','Gose','Fruit Beer','Other',
]

export default function SubmitBeer({ session, onSubmitted }) {
  const [form, setForm] = useState({ name: '', brewery: '', style: '', abv: '', country: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.brewery.trim() || !form.style) {
      setError('Name, brewery and style are required.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.from('beers').insert({
      name: form.name.trim(),
      brewery: form.brewery.trim(),
      style: form.style,
      abv: form.abv ? parseFloat(form.abv) : null,
      country: form.country.trim() || null,
      description: form.description.trim() || null,
      submitted_by: session.user.id,
      is_user_submitted: true,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="submit-wrap">
        <div className="submit-card">
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            🎉 Beer submitted! It is now available for everyone to rate.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={onSubmitted}>Browse Beers</button>
            <button className="btn btn-ghost" onClick={() => { setSuccess(false); setForm({ name: '', brewery: '', style: '', abv: '', country: '', description: '' }) }}>Submit Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="submit-wrap">
      <div className="submit-card">
        <div className="submit-title">Submit a Beer</div>
        <p className="submit-sub">Can't find the beer you're looking for? Add it to the database for everyone to rate.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">Beer Name *</label>
              <input className="form-input" type="text" placeholder="e.g. Pacific Ale" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Brewery *</label>
              <input className="form-input" type="text" placeholder="e.g. Stone & Wood" value={form.brewery} onChange={e => set('brewery', e.target.value)} required />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">Style *</label>
              <select className="form-select" value={form.style} onChange={e => set('style', e.target.value)} required>
                <option value="">Select style…</option>
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ABV %</label>
              <input className="form-input" type="number" placeholder="e.g. 4.5" min="0" max="50" step="0.1" value={form.abv} onChange={e => set('abv', e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Country</label>
            <input className="form-input" type="text" placeholder="e.g. Australia" value={form.country} onChange={e => set('country', e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Description</label>
            <textarea
              className="modal-textarea"
              placeholder="Tasting notes, style description, what makes this beer special…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              maxLength={500}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Beer'}
          </button>
        </form>
      </div>
    </div>
  )
}
