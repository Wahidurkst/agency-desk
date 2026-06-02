'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    var result = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <main className="page-center">
      <section className="auth-card">
        <div className="auth-logo">AD</div>
        <h1>Welcome back</h1>
        <p>Login to manage projects, tasks, status, and team work in one simple workspace.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          {error ? <div className="error-box">{error}</div> : null}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={function (event) {
                setEmail(event.target.value)
              }}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={function (event) {
                setPassword(event.target.value)
              }}
              placeholder="Your password"
              required
            />
          </label>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          New here? <Link href="/signup">Create an account</Link>
        </div>
      </section>
    </main>
  )
}
