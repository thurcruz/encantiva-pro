import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil } from 'lucide-react'
import BotaoDeletar from './componentes/BotaoDeletar'

export default async function PaginaListaMateriais() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/materiais')

  const { data: materiais } = await supabase
    .from('materiais')
    .select('*, temas(*), tipos_peca(*), formatos(*)')
    .order('criado_em', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Materiais</h1>
          <p className="text-gray-500 mt-1">{materiais?.length ?? 0} materiais cadastrados</p>
        </div>
        <Link
          href="/admin/materiais/novo"
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} />
          Novo Material
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Material</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Tema</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Tipo</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Downloads</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {materiais?.map((material) => (
              <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {material.url_imagem_preview ? (
                    <Image
                        src={material.url_imagem_preview}
                        alt={material.titulo}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                        />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                        🎪
                      </div>
                    )}
                    <span className="font-medium text-gray-800">{material.titulo}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{material.temas?.nome ?? '—'}</td>
                <td className="px-6 py-4 text-gray-600">{material.tipos_peca?.nome ?? '—'}</td>
                <td className="px-6 py-4 text-gray-600">{material.total_downloads}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/materiais/${material.id}`}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Pencil size={15} className="text-gray-500" />
                    </Link>
                    <BotaoDeletar id={material.id} titulo={material.titulo} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!materiais || materiais.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium">Nenhum material cadastrado ainda</p>
            <Link href="/admin/materiais/novo" className="text-purple-600 text-sm mt-1 inline-block hover:underline">
              Adicionar o primeiro
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}