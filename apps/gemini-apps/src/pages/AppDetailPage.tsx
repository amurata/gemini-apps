import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import TabataHiitBikeApp from '../apps/tabata-hiit-bike/TabataHiitBikeApp'
import PwaInstallButton from '../components/PwaInstallButton'
import { apps } from '../content/apps'
import NotFoundPage from './NotFoundPage'

function AppDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const app = apps.find((item) => item.slug === slug && item.status === 'published')

  if (!app) {
    return <NotFoundPage />
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 mx-auto flex w-full max-w-6xl items-center justify-between p-4">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/85 px-3 py-1.5 text-xs font-semibold text-zinc-100 backdrop-blur transition hover:border-zinc-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to TOP
        </Link>
        {app.pwaPrimary ? (
          <div className="pointer-events-auto">
            <PwaInstallButton />
          </div>
        ) : null}
      </div>

      {slug === 'tabata-hiit-bike' ? <TabataHiitBikeApp /> : <NotFoundPage />}
    </div>
  )
}

export default AppDetailPage
