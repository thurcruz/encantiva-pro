import type { Metadata } from 'next'
import PaginaModulos from './PaginaModulos'

export const metadata: Metadata = {
  title: 'Biblioteca & Contratos — Encantiva Pro',
  description: 'Acesso vitalicio a Biblioteca de Materiais ou Contratos ilimitados por R$19,90 pagamento unico.',
}

export default function PageModulos() {
  return <PaginaModulos />
}