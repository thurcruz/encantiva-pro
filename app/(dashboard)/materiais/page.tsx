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

  const vazio = !materiais || materiais.length === 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Materiais para Download" subtitulo="Painéis, totens e muito mais prontos para imprimir" maxWidth="1200px" />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* ── Banner de novidades ── */}
        <div style={{ background: 'linear-gradient(135deg, #fff0fb, #f5f0ff)', border: '1px solid #ffd6f5', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px' }}>
            🎨
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 4px' }}>
              Novos painéis chegando!
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Estamos adicionando os painéis à plataforma. Em breve você poderá baixar o original ou usar o cortador automático para gerar as folhas A4 prontas para impressão caseira.
            </p>
          </div>
        </div>

        <FiltrosMateriais
          categorias={categorias ?? []}
          tipos={tipos ?? []}
          formatos={formatos ?? []}
          categoriaSelecionada={categoria}
          tipoSelecionado={tipo}
          formatoSelecionado={formato}
          buscaInicial={busca ?? ''}
        />

        {materiais && !vazio && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '14px 0 0 2px' }}>
            {materiais.length} {materiais.length === 1 ? 'material encontrado' : 'materiais encontrados'}
          </p>
        )}

        {vazio ? (
          <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', textAlign: 'center', padding: '72px 24px', marginTop: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎪</div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#374151', margin: '0 0 8px' }}>
              Em breve aqui!
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: 0, maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Os painéis estão sendo preparados com carinho. Fique de olho — novos materiais serão adicionados em breve.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '14px' }}>
            {materiais.map(material => (
              <CardMaterial key={material.id} material={material as Material} podeDownload={true} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}