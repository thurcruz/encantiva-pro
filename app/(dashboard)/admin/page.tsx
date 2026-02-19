import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Upload, Package, Users } from 'lucide-react'

export default async function PaginaAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/materiais')

  const [
    { count: totalMateriais },
    { count: totalAssinantes },
    { count: totalDownloads },
  ] = await Promise.all([
    supabase.from('materiais').select('*', { count: 'exact', head: true }),
    supabase.from('assinaturas').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('historico_downloads').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Painel Admin</h1>
        <p className="text-gray-500 mt-1">Gerencie os materiais e assinantes</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Package size={20} className="text-purple-600" />
            </div>
            <span className="text-gray-500 text-sm">Materiais</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalMateriais ?? 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <Users size={20} className="text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">Assinantes ativos</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalAssinantes ?? 0}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Upload size={20} className="text-blue-600" />
            </div>
            <span className="text-gray-500 text-sm">Downloads totais</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalDownloads ?? 0}</p>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/materiais/novo"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <Upload size={16} />
            Novo Material
          </Link>
          <Link
            href="/admin/materiais"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <Package size={16} />
            Ver todos os materiais
          </Link>
        </div>
      </div>
    </div>
  )
}