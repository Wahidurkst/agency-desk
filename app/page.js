'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(function () {
    router.replace('/dashboard')
  }, [router])

  return <main className="page-center">Loading...</main>
}
