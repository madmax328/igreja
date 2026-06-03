'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [menuAberto, setMenuAberto] = useState(false)

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '◈' },
    { href: '/admin/live', label: 'Live', icon: '⬤' },
    { href: '/admin/cultos', label: 'Cultos', icon: '☩' },
    { href: '/admin/cortes', label: 'Cortes', icon: '✂' },
    { href: '/admin/perfil', label: 'Perfil', icon: '◎' },
  ]

  const NavLinks = () => (
    <>
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuAberto(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            pathname === item.href
              ? 'bg-gold-500/10 text-gold-400'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </>
  )

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <span className="text-gold-400 font-bold text-lg">Igreja Admin</span>
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="text-zinc-400 hover:text-white p-2"
          aria-label="Menu"
        >
          {menuAberto ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {menuAberto && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70" onClick={() => setMenuAberto(false)}>
          <div className="w-72 h-full bg-zinc-900 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-zinc-800">
              <p className="text-gold-400 font-bold text-xl">Igreja Admin</p>
              <p className="text-zinc-500 text-sm mt-1 truncate">{session?.user?.email}</p>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <NavLinks />
            </nav>
            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="w-full text-sm text-zinc-500 hover:text-white transition-colors py-2"
              >
                Terminar sessão
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 min-h-screen bg-zinc-900 border-r border-zinc-800 flex-col fixed top-0 left-0">
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-gold-400 font-bold text-xl">Igreja Admin</h1>
            <p className="text-zinc-500 text-sm mt-1 truncate">{session?.user?.email}</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavLinks />
          </nav>
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="w-full text-sm text-zinc-500 hover:text-white transition-colors py-2"
            >
              Terminar sessão
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-auto min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
