export type PortfolioApp = {
  id: string
  slug: string
  title: string
  summary: string
  tags: string[]
  pwaPrimary: boolean
  status: 'published' | 'draft'
}
