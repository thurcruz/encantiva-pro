import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Material } from '@/types/database'
import FiltrosMateriais from './componentes/FiltrosMateriais'
import CardMaterial from './componentes/CardMaterial'

export default async function PaginaMateriais({
  searchParams,
}: {
  searchParams: { tema?: string; tipo?: string; formato?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, expira_em')
    .eq('usuario_id', user.id)
    .single()

  const assinaturaAtiva =
    assinatura?.status === 'ativo' &&
    (!assinatura.expira_em || new Date(assinatura.expira_em) > new Date())

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const [{ data: temas }, { data: tipos }, { data: formatos }] = await Promise.all([
    supabase.from('temas').select('*').eq('ativo', true).order('nome'),
    supabase.from('tipos_peca').select('*').order('nome'),
    supabase.from('formatos').select('*').order('nome'),
  ])

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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid #eeeeee',
        padding: '32px 40px',
        backgroundColor: '#fff',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '4px', height: '32px', borderRadius: '4px',
              background: 'linear-gradient(180deg, #ff33cc, #9900ff)',
            }} />
            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: '28px',
              color: '#140033',
              letterSpacing: '-1px',
              margin: 0,
            }}>
              Materiais para Download
            </h1>
          </div>
          <p style={{
            color: '#00000055',
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            marginLeft: '16px',
            marginTop: '4px',
          }}>
            Painéis, totens e muito mais prontos para imprimir
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 40px' }}>

        {/* Aviso de assinatura */}
        {!assinaturaAtiva && !isAdmin && (
          <div style={{
            background: '#fff5fd',
            border: '1px solid #ff33cc33',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                color: '#ff33cc',
                margin: '0 0 4px 0',
              }}>
                Assinatura necessária
              </p>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                color: '#00000066',
                fontSize: '14px',
                margin: 0,
              }}>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
            marginTop: '28px',
          }}>
            {materiais.map((material) => (
              <CardMaterial
                key={material.id}
                material={material as Material}
                podeDownload={assinaturaAtiva || isAdmin}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎪</p>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: '#00000044',
              marginBottom: '8px',
            }}>
              Nenhum material encontrado
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000033' }}>
              Tente mudar os filtros
            </p>
          </div>
        )}
      </div>
    </div>
  )
}