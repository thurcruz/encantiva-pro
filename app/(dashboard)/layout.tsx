import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Package, LayoutDashboard, Upload } from 'lucide-react'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-purple-700">Encantiva Pro</h1>
          <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/materiais"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
          >
            <Package size={18} />
            Materiais
          </Link>

          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
              </div>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
              >
                <LayoutDashboard size={18} />
                Painel Admin
              </Link>
              <Link
                href="/admin/materiais/novo"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
              >
                <Upload size={18} />
                Novo Material
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition w-full"
            >
              <LogOut size={18} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}