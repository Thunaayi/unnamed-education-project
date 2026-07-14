'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PracticeRedirect() {
  const router = useRouter()
  useEffect(() => {
    fetch('/api/topics').then(r => r.json()).then(d => {
      const topics = d.topics ?? []
      if (topics.length > 0) router.replace(`/practice/${topics[0].id}`)
      else router.replace('/topics')
    }).catch(() => router.replace('/topics'))
  }, [router])
  return null
}
