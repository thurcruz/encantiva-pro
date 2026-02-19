import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Material, Tema, TipoPeca, Formato } from '@/types/database'
import FiltrosMateriais from './componentes/FiltrosMateriais'
import CardMaterial from './componentes/CardMaterial'

export default async function PaginaMateriais({
  searchParams,
}: {
  searchParams: { tema?: string; tipo?: string; formato?: string }
}) {
  const supabase = await createClient()

  // Verifica sessão
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verifica assinatura ativa
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, expira_em')
    .eq('usuario_id', user.id)
    .single()

  const assinaturaAtiva =
    assinatura?.status === 'ativo' &&
    (!assinatura.expira_em || new Date(assinatura.expira_em) > new Date())

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  // Busca filtros
  const [{ data: temas }, { data: tipos }, { data: formatos }] = await Promise.all([
    supabase.from('temas').select('*').eq('ativo', true).order('nome'),
    supabase.from('tipos_peca').select('*').order('nome'),
    supabase.from('formatos').select('*').order('nome'),
  ])

  // Busca materiais com filtros
  let query = supabase
    .from('materiais')
    .select('*, temas(*), tipos_peca(*), formatos(*)')
    .eq('ativo', true)
    .order('criado_em', { ascending: false })

  if (searchParams.tema) query = query.eq('tema_id', searchParams.tema)
  if (searchParams.tipo) query = query.eq('tipo_peca_id', searchParams.tipo)
  if (searchParams.formato) query = query.eq('formato_id', searchParams.formato)

  const { data: materiais } = await query

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Materiais para Download</h1>
        <p className="text-gray-500 mt-1">
          Painéis, totens e muito mais prontos para imprimir
        </p>
      </div>

      {/* Aviso de assinatura */}
      {!assinaturaAtiva && !isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-yellow-600 text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-yellow-800">Assinatura necessária</p>
            <p className="text-yellow-700 text-sm">
              Para baixar os materiais você precisa ter uma assinatura ativa.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <FiltrosMateriais
        temas={temas ?? []}
        tipos={tipos ?? []}
        formatos={formatos ?? []}
        temaSelecionado={searchParams.tema}
        tipoSelecionado={searchParams.tipo}
        formatoSelecionado={searchParams.formato}
      />

      {/* Grid de materiais */}
      {materiais && materiais.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {materiais.map((material) => (
            <CardMaterial
              key={material.id}
              material={material}
              podeDownload={assinaturaAtiva || isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🎪</p>
          <p className="text-lg font-medium">Nenhum material encontrado</p>
          <p className="text-sm mt-1">Tente mudar os filtros</p>
        </div>
      )}
    </div>
  )
}