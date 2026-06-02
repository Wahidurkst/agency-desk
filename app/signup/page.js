'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    var result = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    if (result.data && result.data.session) {
      router.replace('/dashboard')
      return
    }

    setSuccess('Account created. Please check your email to confirm your account, then login.')
    setLoading(false)
  }

  return (
    <main className="page-center">
      <section className="auth-card">
        <div className="auth-logo">AD</div>
        <h1>Create your workspace</h1>
        <p>Start your own Asana-style project management system for your agency or team.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          {error ? <div className="error-box">{error}</div> : null}
          {success ? <div className="success-box">{success}</div> : null}

          <label>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={function (event) {
                setFullName(event.target.value)
              }}
              placeholder="Your name"
            />
          </label>

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
              placeholder="Minimum 6 characters"
              minLength="6"
              required
            />
          </label>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Login</Link>
        </div>
      </section>
    </main>
  )
}
