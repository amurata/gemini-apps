import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <AlertTriangle className="mb-4 h-10 w-10 text-amber-400" />
      <h1 className="text-3xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-sm text-zinc-400">ページが見つかりません。</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
      >
        TOPへ戻る
      </Link>
    </main>
  )
}

export default NotFoundPage
