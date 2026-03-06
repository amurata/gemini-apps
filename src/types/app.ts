export type PortfolioApp = {
  id: string
  title: string
  summary: string
  tags: string[]
  url: string
  status: 'published' | 'draft'
}
