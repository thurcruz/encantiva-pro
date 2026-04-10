import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites } from '@/lib/planos'
import type { Material } from '@/types/database'
import FiltrosMateriais from './componentes/FiltrosMateriais'
import CardMaterial from './componentes/CardMaterial'
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

  // Verificar módulo avulso de biblioteca
  const { data: moduloBiblioteca } = await supabase
    .from('modulos_avulsos')
    .select('id, status')
    .eq('usuario_id', user.id)
    .eq('modulo', 'biblioteca')
    .eq('status', 'active')
    .maybeSingle()

  const temModuloBiblioteca = !!moduloBiblioteca

  // Contar downloads do mês atual
  const inicioMes = new Date()
  inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)

  const { count: downloadsNoMes } = await supabase
    .from('historico_downloads')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', user.id)
    .gte('baixado_em', inicioMes.toISOString())

  const downloadsMes = downloadsNoMes ?? 0
  const limiteDownloads = temModuloBiblioteca ? 'ilimitado' : limites.downloadMateriais
  const limiteNumerico = temModuloBiblioteca ? null : (typeof limiteDownloads === 'number' ? limiteDownloads : null)
  const limiteAtingido = !temModuloBiblioteca && limiteNumerico !== null && downloadsMes >= limiteNumerico && !isAdmin && !isBeta

  // downloadMateriais é numérico — todos têm acesso, limite controlado pela barra e pelo CardMaterial

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

        {/* ── Card modulo avulso ativo ── */}
        {temModuloBiblioteca && (
          <div style={{ background: 'linear-gradient(135deg, #fff0fb, #f5f0ff)', border: '1.5px solid #ff33cc44', borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>🎨</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '13px', color: '#ff33cc', margin: '0 0 2px' }}>Biblioteca Vitalicia Ativa</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', margin: 0 }}>Voce tem acesso ilimitado a todos os materiais gratuitos e exclusivos.</p>
            </div>
            <span style={{ background: '#ff33cc', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', padding: '4px 12px', borderRadius: '999px', flexShrink: 0 }}>Vitalicio</span>
          </div>
        )}

        {/* ── Uso mensal de downloads ── */}
        {limiteNumerico !== null && !isAdmin && !isBeta && !temModuloBiblioteca && (
          <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
              <div style={{ flexShrink: 0 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 3px' }}>
                  Downloads este mês
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: limiteAtingido ? '#dc2626' : '#111827', fontWeight: 700, margin: 0 }}>
                  {downloadsMes} de {limiteNumerico} usados
                </p>
              </div>
              <div style={{ flex: 1, minWidth: '80px' }}>
                <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (downloadsMes / limiteNumerico) * 100)}%`,
                    height: '100%',
                    background: limiteAtingido ? '#dc2626' : downloadsMes / limiteNumerico >= 0.7 ? '#f59e0b' : '#10b981',
                    borderRadius: '999px',
                    transition: 'width .4s',
                  }} />
                </div>
              </div>
            </div>
            {limiteAtingido && (
              <a href="/planos" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ff33cc', borderRadius: '999px', padding: '8px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', flexShrink: 0 }}>
                Fazer upgrade →
              </a>
            )}
          </div>
        )}

        {/* ── Banner de novidades ── */}
        <div style={{ background: 'linear-gradient(135deg, #fff0fb, #f5f0ff)', border: '1px solid #ffd6f5', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px' }}>🎨</div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 4px' }}>
              Novos painéis chegando!
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Estamos adicionando os painéis à plataforma. Em breve você poderá baixar o original ou usar o cortador automático.
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
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#374151', margin: '0 0 8px' }}>Em breve aqui!</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: 0, maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Os painéis estão sendo preparados com carinho.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '14px' }}>
            {materiais.map(material => (
              <CardMaterial
                key={material.id}
                material={material as Material}
                podeDownload={!limiteAtingido}
                isExclusivo={(material as unknown as { exclusivo?: boolean }).exclusivo ?? false}
                limiteDownloads={limiteDownloads}
                downloadsMes={downloadsMes}
                planoId={planoId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}