import { ArrowUpRight, ExternalLink, Flame } from 'lucide-react'
import { apps } from '../content/apps'

const publishedApps = apps.filter((app) => app.status === 'published')

function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#3f1d2a_0%,_#12090f_35%,_#09090b_100%)] text-zinc-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-16">
        <header className="mb-14 max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs tracking-[0.2em] text-zinc-300">
            <Flame className="h-3.5 w-3.5 text-red-400" />
            GEMINI APPS PORTFOLIO
          </p>
          <h1 className="text-4xl font-black tracking-tight text-zinc-100 md:text-5xl">
            生成アプリを実運用できる形で並べる
          </h1>
          <p className="mt-4 text-sm text-zinc-400 md:text-base">
            Geminiが生成したアプリをReact/Viteで構築し、独立PWAとして公開しています。
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          {publishedApps.map((app) => (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/75 p-6 transition hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-zinc-100">{app.title}</h2>
                <ArrowUpRight className="h-5 w-5 text-zinc-500 transition group-hover:text-zinc-200" />
              </div>

              <p className="text-sm text-zinc-400">{app.summary}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {app.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-zinc-700 bg-zinc-800/70 px-3 py-1 text-xs tracking-wide text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
                <ExternalLink className="h-3.5 w-3.5" />
                {new URL(app.url).hostname}
              </p>
            </a>
          ))}
        </section>
      </main>
    </div>
  )
}

export default HomePage
