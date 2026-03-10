import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import BeerBrowser from './components/BeerBrowser'
import MyRatings from './components/MyRatings'
import SubmitBeer from './components/SubmitBeer'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('browse')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          🍺 HMB <span className="logo-sub">Rate My Beer</span>
        </div>
        {session && (
          <div className="header-right">
            <nav className="desktop-nav">
              <button className={`nav-link ${page === 'browse' ? 'active' : ''}`} onClick={() => setPage('browse')}>Browse</button>
              <button className={`nav-link ${page === 'ratings' ? 'active' : ''}`} onClick={() => setPage('ratings')}>My Ratings</button>
              <button className={`nav-link ${page === 'submit' ? 'active' : ''}`} onClick={() => setPage('submit')}>Submit</button>
            </nav>
            <div className="user-avatar" title={session.user.email}>
              {session.user.email[0].toUpperCase()}
            </div>
            <button className="sign-out-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        )}
      </header>

      <main className="main">
        {!session ? (
          <Auth />
        ) : page === 'browse' ? (
          <BeerBrowser session={session} />
        ) : page === 'ratings' ? (
          <MyRatings session={session} />
        ) : (
          <SubmitBeer session={session} onSubmitted={() => setPage('browse')} />
        )}
      </main>

      {session && (
        <nav className="bottom-nav">
          <button className={`bottom-nav-btn ${page === 'browse' ? 'active' : ''}`} onClick={() => setPage('browse')}>
            <span className="nav-icon">🍺</span>
            Browse
          </button>
          <button className={`bottom-nav-btn ${page === 'ratings' ? 'active' : ''}`} onClick={() => setPage('ratings')}>
            <span className="nav-icon">⭐</span>
            My Ratings
          </button>
          <button className={`bottom-nav-btn ${page === 'submit' ? 'active' : ''}`} onClick={() => setPage('submit')}>
            <span className="nav-icon">➕</span>
            Submit
          </button>
        </nav>
      )}
    </div>
  )
}
