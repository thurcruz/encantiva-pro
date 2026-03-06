import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CatalogoManager from './CatalogoManager'

export default async function PaginaCatalogo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: temas }, { data: kits }, { data: adicionais }, { data: pedidos }] = await Promise.all([
    supabase.from('catalogo_temas').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('catalogo_kits').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('adicionais').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('pedidos').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div className="page-header" style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
              Catálogo & Pedidos
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
              Monte seu catálogo e receba pedidos pelo WhatsApp
            </p>
          </div>
        </div>
      </div>
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>
        <CatalogoManager
          usuarioId={user.id}
          temasIniciais={temas ?? []}
          kitsIniciais={kits ?? []}
          adicionaisIniciais={adicionais ?? []}
          pedidosIniciais={pedidos ?? []}
        />
      </div>
    </div>
  )
}