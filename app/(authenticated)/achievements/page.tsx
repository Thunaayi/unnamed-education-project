'use client'

import { useEffect, useState } from 'react'
import { getAchievementIcon, IconLock, IconClose } from '@/app/components/icons'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  current: number
  target: number
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ icon: string; title: string } | null>(null)

  useEffect(() => {
    fetch('/api/achievements')
      .then(r => r.json())
      .then(d => {
        const list: Achievement[] = d.achievements ?? []

        const prevRaw = sessionStorage.getItem('ss-achievements')
        if (prevRaw) {
          try {
            const prev: Achievement[] = JSON.parse(prevRaw)
            const newlyUnlocked = list.find(a => a.unlocked && !prev.find(p => p.id === a.id)?.unlocked)
            if (newlyUnlocked) {
              setToast({ icon: newlyUnlocked.icon, title: newlyUnlocked.title })
              fireConfetti()
              setTimeout(() => setToast(null), 4000)
            }
          } catch {}
        }

        sessionStorage.setItem('ss-achievements', JSON.stringify(list))
        setAchievements(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const unlockedCount = achievements.filter(a => a.unlocked).length

  if (loading) {
    return (
      <main>
        <div style={{ height: '24px', margin: '24px 0' }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: '160px', borderRadius: 'var(--radius-lg)' }} className="skeleton" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main>
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div className="section-head" style={{ marginTop: '24px' }}>
        <h2>Achievements</h2>
        <span className="eyebrow">{unlockedCount} / {achievements.length} unlocked</span>
      </div>

      <div style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '50%',
          background: unlockedCount === achievements.length ? 'var(--primary)' : 'var(--primary-tint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700,
          color: unlockedCount === achievements.length ? 'var(--primary-ink)' : 'var(--primary)',
          flexShrink: 0,
        }}>
          {unlockedCount}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--ink)', marginBottom: '4px' }}>
            {unlockedCount === 0
              ? 'Start practicing to earn achievements'
              : unlockedCount === achievements.length
                ? 'All achievements unlocked!'
                : `${achievements.length - unlockedCount} more to go`}
          </div>
          <div style={{ height: '6px', background: 'var(--bg-sunken)', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
            <div style={{
              height: '100%',
              width: `${(unlockedCount / achievements.length) * 100}%`,
              background: 'var(--primary)',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {achievements.map(a => (
          <div
            key={a.id}
            style={{
              background: a.unlocked ? 'var(--bg-raised)' : 'var(--bg-sunken)',
              border: `1px solid ${a.unlocked ? 'var(--rule)' : 'transparent'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              opacity: a.unlocked ? 1 : 0.45,
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {!a.unlocked && (
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                width: '20px', height: '20px',
                borderRadius: '50%',
                border: '2px solid var(--ink-faint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink-faint)',
                fontSize: '11px', fontWeight: 600,
              }}>
                <IconLock size={11} />
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>{getAchievementIcon(a.icon, 28)}</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)', marginBottom: '4px' }}>
              {a.title}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '12px', lineHeight: 1.3 }}>
              {a.description}
            </div>
            {!a.unlocked && (
              <div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '11px', fontFamily: 'var(--mono)',
                  color: 'var(--ink-faint)', marginBottom: '4px',
                }}>
                  <span>{a.current} / {a.target}</span>
                  <span>{Math.round(a.progress)}%</span>
                </div>
                <div style={{ height: '4px', background: 'var(--rule)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${a.progress}%`,
                    background: 'var(--primary)',
                    borderRadius: '2px',
                  }} />
                </div>
              </div>
            )}
            {a.unlocked && (
              <div style={{
                fontSize: '11px', fontFamily: 'var(--mono)',
                color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span>✓ Unlocked</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

function fireConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  const colors = ['#3B7A57', '#C97A22', '#B5402F', '#EAF2EC', '#DDD7C6', '#1C1F1B']
  const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; rotation: number; rotSpeed: number }[] = []
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * -1,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
    })
  }
  let frame = 0
  function animate() {
    frame++
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.rotation += p.rotSpeed
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      ctx.restore()
    }
    if (frame < 120) requestAnimationFrame(animate)
    else canvas.remove()
  }
  requestAnimationFrame(animate)
}

function Toast({ message, onDismiss }: {
  message: { icon: string; title: string } | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 100,
      background: 'var(--ink)',
      color: 'var(--bg)',
      padding: '12px 20px',
      borderRadius: 'var(--radius)',
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '14px', fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      animation: 'toastIn 0.3s ease',
      whiteSpace: 'nowrap',
    }}>
      {getAchievementIcon(message.icon, 20)}
      <span>Achievement unlocked: {message.title}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent', border: 'none', color: 'var(--ink-faint)',
          cursor: 'pointer', fontSize: '16px', padding: '0 0 0 8px',
          fontFamily: 'var(--body)',
        }}
      >
        <IconClose size={16} />
      </button>
    </div>
  )
}
