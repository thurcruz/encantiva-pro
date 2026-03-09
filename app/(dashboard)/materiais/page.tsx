import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites, temAcesso } from '@/lib/planos'
import type { Material } from '@/types/database'
import FiltrosMateriais from './componentes/FiltrosMateriais'
import CardMaterial from './componentes/CardMaterial'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaMateriais({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; tipo?: string; formato?: string; busca?: string }>
}) {
  const { categoria, tipo, formato, busca } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, plano, trial_expira_em, is_beta')
    .eq('usuario_id', user.id)
    .single()

  const isBeta = assinatura?.is_beta === true
  const planoId = getPlanoId(assinatura?.status ?? null, assinatura?.plano ?? null, assinatura?.trial_expira_em ?? null, isAdmin)
  const limites = getLimites(planoId)

  if (!temAcesso('bibliotecaMateriais', limites, isBeta, isAdmin)) {
    return <ModuloBloqueado titulo="Materiais para Download" descricao="Painéis, totens e muito mais prontos para imprimir e usar nas suas festas." planoMinimo="iniciante" icone="🎨" />
  }

  const [{ data: categorias }, { data: tipos }, { data: formatos }] = await Promise.all([
    supabase.from('categorias').select('*').eq('ativo', true).order('nome'),
    supabase.from('tipos_peca').select('*').order('nome'),
    supabase.from('formatos').select('*').order('nome'),
  ])

  let query = supabase
    .from('materiais')
    .select('*, temas(*), categorias(*), tipos_peca(*), formatos(*)')
    .eq('ativo', true)
    .order('criado_em', { ascending: false })

  if (categoria) query = query.eq('categoria_id', categoria)
  if (tipo) query = query.eq('tipo_peca_id', tipo)
  if (formato) query = query.eq('formato_id', formato)
  if (busca) query = query.ilike('titulo', `%${busca}%`)

  const { data: materiais } = await query

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <PageHeader titulo="Materiais para Download" subtitulo="Painéis, totens e muito mais prontos para imprimir" maxWidth="1200px" />
      <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 40px' }}>
        <FiltrosMateriais
          categorias={categorias ?? []}
          tipos={tipos ?? []}
          formatos={formatos ?? []}
          categoriaSelecionada={categoria}
          tipoSelecionado={tipo}
          formatoSelecionado={formato}
          buscaInicial={busca ?? ''}
        />
        {materiais && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000044', margin: '20px 0 0 0' }}>
            {materiais.length} {materiais.length === 1 ? 'material encontrado' : 'materiais encontrados'}
          </p>
        )}
        {materiais && materiais.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginTop: '16px' }}>
            {materiais.map((material) => (
              <CardMaterial key={material.id} material={material as Material} podeDownload={true} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎪</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#00000044', marginBottom: '8px' }}>Nenhum material encontrado</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000033' }}>Tente mudar os filtros ou a busca</p>
          </div>
        )}
      </div>
    </div>
  )
}