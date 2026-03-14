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

  if (!temAcesso('downloadMateriais', limites, isBeta, isAdmin)) {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Materiais para Download" subtitulo="Painéis, totens e muito mais prontos para imprimir" maxWidth="1200px" />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 80px' }}>

        <FiltrosMateriais
          categorias={categorias ?? []}
          tipos={tipos ?? []}
          formatos={formatos ?? []}
          categoriaSelecionada={categoria}
          tipoSelecionado={tipo}
          formatoSelecionado={formato}
          buscaInicial={busca ?? ''}
        />

        {/* Contagem */}
        {materiais && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '14px 0 0 2px' }}>
            {materiais.length} {materiais.length === 1 ? 'material encontrado' : 'materiais encontrados'}
          </p>
        )}

        {/* Grid */}
        {materiais && materiais.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '14px',
          }}>
            {materiais.map(material => (
              <CardMaterial key={material.id} material={material as Material} podeDownload={true} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', marginTop: '16px' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>🎪</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#374151', margin: '0 0 6px' }}>Nenhum material encontrado</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Tente mudar os filtros ou a busca</p>
          </div>
        )}
      </div>
    </div>
  )
}