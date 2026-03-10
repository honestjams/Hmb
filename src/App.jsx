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
        <div className="header-logo">
          🍺 HMB <span>Rate My Beer</span>
        </div>
        {session && (
          <nav className="header-nav">
            <button className={`nav-btn ${page === 'browse' ? 'active' : ''}`} onClick={() => setPage('browse')}>Browse</button>
            <button className={`nav-btn ${page === 'history' ? 'active' : ''}`} onClick={() => setPage('history')}>My Ratings</button>
            <button className={`nav-btn ${page === 'submit' ? 'active' : ''}`} onClick={() => setPage('submit')}>Submit Beer</button>
            <div className="user-chip">
              <div className="user-avatar">{session.user.email[0].toUpperCase()}</div>
              <span className="user-email">{session.user.email}</span>
            </div>
            <button className="nav-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </nav>
        )}
      </header>

      <main className="main">
        {!session ? (
          <Auth />
        ) : page === 'browse' ? (
          <BeerBrowser session={session} />
        ) : page === 'history' ? (
          <MyRatings session={session} />
        ) : (
          <SubmitBeer session={session} onSubmitted={() => setPage('browse')} />
        )}
      </main>
    </div>
  )
}
