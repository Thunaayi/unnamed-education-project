'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard', label: 'Today', kbd: 'T',
      svg: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/>' },
    { href: '/subjects', label: 'Subjects', kbd: 'S',
      svg: '<path d="M4 5.5c2-1 5-1 7 .5v13c-2-1.5-5-1.5-7-.5z"/><path d="M20 5.5c-2-1-5-1-7 .5v13c2-1.5 5-1.5 7-.5z"/>' },
    { href: '/topics', label: 'Topics', kbd: 'P',
      svg: '<path d="M5 19v-5"/><path d="M11.5 19V8"/><path d="M18 19v-9"/>' },
    { href: '/past-papers', label: 'Papers', kbd: 'E',
      svg: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>' },
    { href: '/progress', label: 'Progress', kbd: 'R',
      svg: '<path d="M4 17V14H8V11H12V8H16V5H20"/>' },
    { href: '/achievements', label: 'Achievements', kbd: 'A',
      svg: '<path d="M12 15l-3.5 2 1-4-3-2.5 4-.5L12 6l1.5 4 4 .5-3 2.5 1 4z"/><path d="M12 2v4"/><circle cx="12" cy="12" r="10"/>' },
    { href: '/settings', label: 'Settings', kbd: 'G',
      svg: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
  ]

  return (
    <nav className="sidebar">
      {tabs.map(tab => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link key={tab.href} href={tab.href} className={isActive ? 'active' : ''}>
            <div className="nav-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: tab.svg }} />
              <span className="tab-label">{tab.label}</span>
            </div>
            <span className="nav-kbd">{tab.kbd}</span>
          </Link>
        )
      })}
    </nav>
  )
}
