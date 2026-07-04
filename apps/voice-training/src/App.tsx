import type React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Mic, Square,
  Volume2, ChevronDown, ChevronUp, Download, Share2, RotateCcw,
  BarChart3, X, Plus, Pencil, Trash2, Check
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DrillData {
  sounds: string
  words: string[]
  sentence: string
}

interface TextItem {
  id: string
  title: string
  text: string
  author: string
}

interface Scripts {
  intro: string
  main: string
  conclusion: string
}

interface Evaluation {
  clarity: number
  ease: number
  hoarseness: number
}

interface HistoryEntry extends Evaluation {
  date: string
}

interface CoachNote {
  why: string
  focus: string[]
  warn: string | null
  bpm?: string
}

// ── Data Constants ────────────────────────────────────────────────────────────

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

const DRILL_SCHEDULE: Record<number, string[] | null> = {
  1: ['カ行', 'サ行'],
  2: ['タ行', 'ラ行'],
  3: ['カ行', 'ハ行'],
  4: ['サ行', 'ラ行'],
  5: ['タ行', 'ハ行'],
  6: null,
  0: null,
}

const DEFAULT_DRILLS: Record<string, DrillData> = {
  カ行: { sounds: 'か き く け こ', words: ['確認', '共有'], sentence: '確認事項を共有します' },
  サ行: { sounds: 'さ し す せ そ', words: ['資料', '仕様'], sentence: '資料の要点を説明します' },
  タ行: { sounds: 'た ち つ て と', words: ['対応', '手順'], sentence: '対応手順を確認します' },
  ラ行: { sounds: 'ら り る れ ろ', words: ['理由', '理解'], sentence: '理由を整理して説明します' },
  ハ行: { sounds: 'は ひ ふ へ ほ', words: ['方針', '発表'], sentence: '方針を発表します' },
}

const DEFAULT_TEXTS: TextItem[] = [
  { id: 'tanka1', title: '短歌', text: 'この味がいいねと君が言ったから七月六日はサラダ記念日', author: '俵万智' },
  { id: 'tanka2', title: '短歌', text: 'くれなゐの二尺伸びたる薔薇の芽の針やはらかに春雨のふる', author: '正岡子規' },
  { id: 'meigen1', title: '名言', text: '為せば成る、為さねば成らぬ何事も、成らぬは人の為さぬなりけり。', author: '上杉鷹山' },
  { id: 'tsurezure', title: '古典', text: 'つれづれなるままに、日暮らし硯に向かひて、心にうつりゆくよしなしごとを、そこはかとなく書きつくれば、あやしうこそものぐるほしけれ。', author: '吉田兼好' },
  { id: 'hojoki', title: '古典', text: 'ゆく河の流れは絶えずして、しかももとの水にあらず。よどみに浮かぶうたかたは、かつ消えかつ結びて、久しくとどまりたるためしなし。', author: '鴨長明' },
]

const DEFAULT_SCRIPTS: Scripts = {
  intro: '本日はお時間をいただきありがとうございます。これから、Expert AX - Level1（Claude Code）を全4回、2ヶ月ほどに渡ってお付き合いいただきます。第1回のテーマは『Claude Code活用の基礎』です。AIを安全に使いこなすための土台を作る内容になっています。',
  main: 'まず、この研修のゴールをお伝えします。Claude Codeというツールを軸にして、AIエージェントを使いこなす技術と知識を獲得してもらうこと、これがこの研修のゴールです。',
  conclusion: '本日のまとめです。今日お伝えした要点は3つです。ひとつずつ振り返ります。',
}

const REC_THEMES = [
  {
    type: '冒頭',
    text: '本日はお時間をいただきありがとうございます。これから、Expert AX - Level1（Claude Code）を全4回、2ヶ月ほどに渡ってお付き合いいただきます。第1回のテーマは『Claude Code活用の基礎』と題して進めて参りたいと思います。まず、この研修のゴールをお伝えします。Claude Codeというツールを軸にして、AIエージェントを使いこなす技術と知識を獲得してもらうこと、これがこの研修のゴールです。',
  },
  {
    type: '質問募集',
    text: 'はい、ではここまでで何か質問はありますか？ちょっとでも引っかかってるところがあればなんでも聞いてください。私は最初Claudeってなんて読むのかわかりませんでしたよ（笑）。そういう小さなことでも全然構いません。ありますか？大丈夫ですかね？では先に進みますね。あとで疑問が湧いたらその時に質問してもらっても全然構いませんので、遠慮なくどうぞ。',
  },
  {
    type: 'まとめ',
    text: '本日のまとめです。今日お伝えした要点は3つです。ひとつ目は、Claude Codeは対話ではなく「構造」で制御するということ。ふたつ目は、CLAUDE.mdとhooksでガードレールを敷くことが最も効果的な安全策だということ。みっつ目は、まず小さく試して、成功体験を積み重ねること。以上が本日の内容です。ありがとうございました。',
  },
]

const STEPS = [
  { id: 'prep', title: '0. 事前準備', duration: 15, icon: '💧' },
  { id: 'rec1', title: '1. 最初の録音', duration: 40, icon: '🎙️' },
  { id: 'warmup', title: '2. 発声ウォームアップ', duration: 90, icon: '🫁' },
  { id: 'reading', title: '3. 教養テキスト音読', duration: 195, icon: '📖' },
  { id: 'script', title: '4. 研修台本ブロック', duration: 180, icon: '🎯' },
  { id: 'drill', title: '5. 子音ドリル', duration: 90, icon: '👄' },
  { id: 'rec2', title: '6. 最後の録音＋評価', duration: 50, icon: '📊' },
]

const COACH: Record<string, CoachNote> = {
  prep: {
    why: '声を出す前の状態を整える。脱水はすぐ声に出る。',
    focus: ['水をひと口', '胸を張りすぎず、首を前に出さない', '声量は「会議室の1対1」くらい'],
    warn: 'のど払いしたくなったら、まず唾か水を飲む（のど払いは声帯に負担）',
  },
  rec1: {
    why: '毎日の「素の状態」を記録して、練習後と比較する。改善は数字ではなく聴き比べでわかる。',
    focus: ['毎日同じテーマで録る（導入/自己紹介/結論のどれか固定）', '直そうとしない、普段の話し方で', '30〜40秒だけ'],
    warn: null,
  },
  warmup: {
    why: 'のどを押さずに「声を前に集める感覚」を作る。唇や前歯のあたりに響かせる練習。',
    focus: ['のどを絞めない', '口の前〜唇あたりに響く感じを探す', '大声は絶対NG'],
    warn: '練習後に余計に枯れたら、力が入りすぎ。もっと小さく・楽にやる。',
  },
  reading: {
    why: '明瞭に話す訓練。「はっきり話して」より「オーバーに口を使って」読むほうが明瞭度の改善が大きい。',
    focus: ['母音を潰さない', '語尾を消さない', '子音を先に当ててから母音に抜く', '句読点でちゃんと切る'],
    warn: 'スピードを上げて「うまく読もう」としない。声を張ってごまかさない。',
    bpm: '54〜60 BPMで開始。1拍＝1文節。遅すぎたら63、雑になったら50台に戻す。',
  },
  script: {
    why: '実際に使う文で練習すると、本番でもそのまま活きやすい。台本練習が最優先。',
    focus: ['意味の塊で区切る', '1文が長すぎるものは削る', '漢語が続く部分は区切りを入れる', '専門用語はそのまま使うが前後を短くする'],
    warn: null,
    bpm: '54〜60 BPMで開始。1拍＝1意味の塊。専門語が詰まるときに使う。常用ではなく補助。',
  },
  drill: {
    why: '全部を毎日やらない。少数の音を、位置を意識して、単語→短文まで繋げる。',
    focus: ['音だけで終わらず、必ず単語→短文まで行く', '速くしない', '舌や唇の位置をはっきり取る'],
    warn: '子音が連続して崩れるときにメトロノームを使う。',
    bpm: '崩れるときだけ使う。54〜60 BPM。語尾が消えるときにも有効。',
  },
  rec2: {
    why: '最初の録音と聴き比べて変化を確認。点数化はざっくりでいい。',
    focus: ['語尾が残っているか', 'こもりが少し減ったか', '子音が前より立っているか'],
    warn: null,
  },
}

// ── Custom Hooks ──────────────────────────────────────────────────────────────

function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds(s => s - 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, seconds])

  const reset = (s: number) => { setSeconds(s); setRunning(false) }
  const toggle = () => setRunning(r => !r)
  const fmt = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return { seconds, running, toggle, reset, formatted: fmt, done: seconds === 0 }
}

function useMetronome() {
  const [bpm, setBpm] = useState(50)
  const [active, setActive] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const nextNoteTimeRef = useRef(0)
  const timerIDRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playClick = useCallback((time: number) => {
    if (!audioCtxRef.current) return
    const osc = audioCtxRef.current.createOscillator()
    const gain = audioCtxRef.current.createGain()
    osc.connect(gain)
    gain.connect(audioCtxRef.current.destination)
    osc.frequency.value = 900
    gain.gain.setValueAtTime(0.3, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08)
    osc.start(time)
    osc.stop(time + 0.08)
  }, [])

  const scheduler = useCallback(() => {
    if (!audioCtxRef.current) return
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + 0.1) {
      playClick(nextNoteTimeRef.current)
      nextNoteTimeRef.current += 60.0 / bpm
    }
    timerIDRef.current = setTimeout(scheduler, 25)
  }, [bpm, playClick])

  useEffect(() => {
    if (active) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05
      scheduler()
    } else {
      if (timerIDRef.current) clearTimeout(timerIDRef.current)
    }
    return () => { if (timerIDRef.current) clearTimeout(timerIDRef.current) }
  }, [active, scheduler])

  const toggle = () => setActive(a => !a)
  const start = () => setActive(true)
  const stop = () => setActive(false)

  return { bpm, setBpm, active, toggle, start, stop }
}

function getRecordingMime(): { mimeType: string; ext: string } {
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('audio/mp4')) return { mimeType: 'audio/mp4', ext: 'm4a' }
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return { mimeType: 'audio/webm;codecs=opus', ext: 'webm' }
    if (MediaRecorder.isTypeSupported('audio/webm')) return { mimeType: 'audio/webm', ext: 'webm' }
  }
  return { mimeType: '', ext: 'webm' }
}

function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeInfo = useRef(getRecordingMime())

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const options = mimeInfo.current.mimeType ? { mimeType: mimeInfo.current.mimeType } : undefined
      mediaRef.current = new MediaRecorder(stream, options)
      chunksRef.current = []
      mediaRef.current.ondataavailable = (e) => chunksRef.current.push(e.data)
      mediaRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeInfo.current.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRef.current.start()
      setRecording(true)
    } catch (err) {
      console.error('Recording failed:', err)
    }
  }

  const stop = () => {
    if (mediaRef.current && recording) {
      mediaRef.current.stop()
      setRecording(false)
    }
  }

  const ext = mimeInfo.current.ext

  const share = async (filename: string) => {
    if (!audioBlob) return
    const file = new File([audioBlob], filename, { type: audioBlob.type })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename })
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(audioBlob)
      a.download = filename
      a.click()
    }
  }

  const clear = () => { setAudioUrl(null); setAudioBlob(null) }

  return { recording, audioUrl, audioBlob, ext, start, stop, share, clear }
}

// ── Shared UI Components ──────────────────────────────────────────────────────

function CoachPanel({ stepId }: { stepId: string }) {
  const [open, setOpen] = useState(true)
  const c = COACH[stepId]
  if (!c) return null

  return (
    <div className="bg-blue-950 border border-blue-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Coach</span>
        {open ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">{c.why}</p>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">意識すること</p>
            <div className="flex flex-wrap gap-1.5">
              {c.focus.map((f, i) => (
                <span key={i} className="inline-block bg-blue-900/60 text-blue-300 text-xs px-2.5 py-1 rounded-md">{f}</span>
              ))}
            </div>
          </div>
          {c.warn && (
            <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-lg px-3 py-2">
              <p className="text-xs text-yellow-400">⚠ {c.warn}</p>
            </div>
          )}
          {c.bpm && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">BPMガイド</p>
              <p className="text-xs text-slate-400 leading-relaxed">{c.bpm}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TimerDisplay({ timer, metro }: { timer: ReturnType<typeof useTimer>; metro?: ReturnType<typeof useMetronome> }) {
  const handleClick = () => {
    timer.toggle()
    if (metro) {
      if (timer.running) metro.stop()
      else metro.start()
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 my-4">
      <div className={`text-5xl font-mono font-bold ${timer.done ? 'text-green-500' : timer.running ? 'text-blue-400' : 'text-slate-500'}`}>
        {timer.formatted}
      </div>
      <button
        onClick={handleClick}
        className={`px-8 py-2.5 rounded-lg font-semibold text-sm text-white transition-colors ${
          timer.done ? 'bg-green-600' : timer.running ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {timer.done ? <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> 完了</span> : timer.running ? <span className="flex items-center gap-1.5"><Pause className="w-4 h-4" /> 一時停止</span> : <span className="flex items-center gap-1.5"><Play className="w-4 h-4" /> スタート</span>}
      </button>
    </div>
  )
}

function MetronomeControl({ metro }: { metro: ReturnType<typeof useMetronome> }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
      <button
        onClick={metro.toggle}
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors ${
          metro.active ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
        }`}
      >
        {metro.active ? <Square className="w-4 h-4" /> : <span className="text-sm">♩</span>}
      </button>
      <input
        type="range" min={40} max={80} value={metro.bpm}
        onChange={e => metro.setBpm(Number(e.target.value))}
        className="flex-1 accent-blue-500"
      />
      <span className="text-sm font-mono text-slate-200 min-w-[60px] text-right">{metro.bpm} BPM</span>
    </div>
  )
}

function RecorderControl({ rec, label }: { rec: ReturnType<typeof useRecorder>; label: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={rec.recording ? rec.stop : rec.start}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-colors ${
            rec.recording ? 'bg-slate-700 hover:bg-slate-600 animate-pulse' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {rec.recording ? <><Square className="w-4 h-4" /> 録音停止</> : <><Mic className="w-4 h-4" /> 録音開始</>}
        </button>
        {rec.recording && <span className="text-red-400 text-sm flex items-center gap-1">● 録音中...</span>}
      </div>
      {rec.audioUrl && (
        <div className="space-y-2">
          <audio controls src={rec.audioUrl} className="w-full h-10" />
          <button
            onClick={() => rec.share(`${label}_${new Date().toISOString().slice(0, 10)}.${rec.ext}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700 text-slate-400 text-xs hover:bg-slate-600 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> 保存・共有
          </button>
        </div>
      )}
    </div>
  )
}


// ── Step Components ───────────────────────────────────────────────────────────

function StepPrep({ timer }: { timer: ReturnType<typeof useTimer> }) {
  return (
    <div className="space-y-4">
      <CoachPanel stepId="prep" />
      <TimerDisplay timer={timer} />
    </div>
  )
}

function RecThemeCard({ themeIndex }: { themeIndex: number }) {
  const theme = REC_THEMES[themeIndex % REC_THEMES.length]
  return (
    <div className="bg-blue-950/50 border border-blue-800/50 rounded-xl p-4">
      <p className="text-xs font-bold text-blue-400 mb-2">本日のテーマ: {theme.type}</p>
      <p className="text-base text-slate-200 leading-relaxed">{theme.text}</p>
    </div>
  )
}

function StepRec1({ timer, rec, themeIndex }: { timer: ReturnType<typeof useTimer>; rec: ReturnType<typeof useRecorder>; themeIndex: number }) {
  const prevRunning = useRef(false)
  useEffect(() => {
    if (timer.running && !prevRunning.current && !rec.recording) rec.start()
    if (!timer.running && prevRunning.current && rec.recording) rec.stop()
    prevRunning.current = timer.running
  }, [timer.running, rec])

  return (
    <div className="space-y-4">
      <CoachPanel stepId="rec1" />
      <RecThemeCard themeIndex={themeIndex} />
      <RecorderControl rec={rec} label="before" />
      <TimerDisplay timer={timer} />
    </div>
  )
}

const WARMUP_PHASES = [
  { title: '① 無声の息', reps: 6, perRep: 5, duration: 30, desc: '鼻から吸って、口から静かに吐く。1回5秒。' },
  { title: '② 「んー」', reps: 8, perRep: 3, duration: 30, desc: '3秒ずつ。口は軽く閉じ、唇か前歯の裏あたりが振動する感じを探す。' },
  { title: '③ んーま/み/む', reps: 10, perRep: 3, duration: 30, desc: '「ん」の楽さを保ったまま後ろの音を足す。ま→み→む→ま…の順で繰り返す。' },
]

function StepWarmup({ timer }: { timer: ReturnType<typeof useTimer> }) {
  const totalDuration = WARMUP_PHASES.reduce((s, p) => s + p.duration, 0)
  const elapsed = totalDuration - timer.seconds

  let phase = 0
  let phaseElapsed = elapsed
  for (let i = 0; i < WARMUP_PHASES.length; i++) {
    if (phaseElapsed < WARMUP_PHASES[i].duration) {
      phase = i
      break
    }
    phaseElapsed -= WARMUP_PHASES[i].duration
    if (i === WARMUP_PHASES.length - 1) {
      phase = WARMUP_PHASES.length - 1
      phaseElapsed = WARMUP_PHASES[i].duration
    }
  }

  const p = WARMUP_PHASES[phase]
  const currentRep = timer.running || timer.done
    ? Math.min(Math.floor(phaseElapsed / p.perRep) + 1, p.reps)
    : 0
  const phaseTimeLeft = p.duration - phaseElapsed

  return (
    <div className="space-y-4">
      <CoachPanel stepId="warmup" />

      <div className="flex gap-1.5">
        {WARMUP_PHASES.map((wp, i) => (
          <div
            key={i}
            className={`flex-1 py-2.5 px-1 rounded-lg text-xs font-semibold text-center transition-colors ${
              i === phase ? 'bg-blue-900 text-blue-200' : i < phase ? 'bg-green-900/50 text-green-400' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {wp.title}
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl p-5 space-y-4">
        <p className="text-slate-200 text-base leading-relaxed">{p.desc}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Array.from({ length: p.reps }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < currentRep ? 'bg-blue-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-mono text-slate-400">
            {currentRep}/{p.reps}回
            {timer.running && <span className="ml-2 text-blue-400">残{phaseTimeLeft}秒</span>}
          </span>
        </div>
      </div>

      <TimerDisplay timer={timer} />
    </div>
  )
}

function useReadingSchedule(texts: TextItem[], totalDuration: number) {
  const totalChars = texts.reduce((s, t) => s + Math.max(t.text.length, 20), 0)
  const perPassDuration = Math.floor(totalDuration / 3)

  const textDurations = texts.map(t => {
    const chars = Math.max(t.text.length, 20)
    return Math.max(8, Math.round(perPassDuration * (chars / totalChars)))
  })
  // 端数をラストに吸収
  const sumPerPass = textDurations.reduce((s, d) => s + d, 0)
  textDurations[textDurations.length - 1] += perPassDuration - sumPerPass

  const passLabels = ['1回目: 普通に読む', '2回目: オーバーに口を使う', '3回目: 意味を伝えるつもりで']

  return { textDurations, perPassDuration, passLabels }
}

function StepReading({
  timer, metro, texts, selectedText, setSelectedText,
  onEditText, onAddText, onRemoveText,
}: {
  timer: ReturnType<typeof useTimer>
  metro: ReturnType<typeof useMetronome>
  texts: TextItem[]
  selectedText: number
  setSelectedText: (v: number) => void
  onEditText: (idx: number, field: string, value: string) => void
  onAddText: (item: TextItem) => void
  onRemoveText: (idx: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [newText, setNewText] = useState({ title: '短歌', text: '', author: '' })

  const initDuration = STEPS.find(s => s.id === 'reading')!.duration
  const { textDurations, perPassDuration, passLabels } = useReadingSchedule(texts, initDuration)

  // タイマー経過から現在のパス・テキストを自動計算
  const elapsed = initDuration - timer.seconds
  let pass = Math.min(Math.floor(elapsed / perPassDuration), 2)
  let passElapsed = elapsed - pass * perPassDuration

  let autoTextIdx = 0
  let textTimeLeft = 0
  let cumulative = 0
  for (let i = 0; i < textDurations.length; i++) {
    if (passElapsed < cumulative + textDurations[i]) {
      autoTextIdx = i
      textTimeLeft = cumulative + textDurations[i] - passElapsed
      break
    }
    cumulative += textDurations[i]
    if (i === textDurations.length - 1) {
      autoTextIdx = i
      textTimeLeft = 0
    }
  }

  const activeIdx = timer.running || timer.done ? autoTextIdx : selectedText
  const activePass = timer.running || timer.done ? pass : 0
  const current = texts[activeIdx] || texts[0]

  const getLabel = (t: TextItem) =>
    t.title === '短歌' ? '歌' : t.title === '名言' ? '言' : '古'

  const passColors = ['text-slate-300', 'text-amber-400', 'text-green-400']

  return (
    <div className="space-y-4">
      <CoachPanel stepId="reading" />

      {/* Pass indicator */}
      <div className="flex gap-1.5">
        {passLabels.map((l, i) => (
          <div
            key={i}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold text-center transition-colors ${
              i === activePass ? 'bg-blue-900 text-blue-200' : i < activePass ? 'bg-green-900/50 text-green-400' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Text selector + edit buttons */}
      <div className="flex gap-1.5 flex-wrap items-center">
        {texts.map((t, i) => (
          <button
            key={t.id} onClick={() => setSelectedText(i)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              i === activeIdx ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {getLabel(t)} {t.author ? t.author.slice(0, 3) : ''}
          </button>
        ))}
        <button onClick={() => setAddMode(!addMode)} className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={() => setEditing(!editing)} className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {addMode && (
        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            {['短歌', '名言', '古典'].map(t => (
              <button
                key={t} onClick={() => setNewText({ ...newText, title: t })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${newText.title === t ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            value={newText.text} onChange={e => setNewText({ ...newText, text: e.target.value })}
            placeholder="テキストを入力..."
            className="w-full p-2.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 text-sm min-h-[60px] resize-y"
          />
          <input
            value={newText.author} onChange={e => setNewText({ ...newText, author: e.target.value })}
            placeholder="作者（任意）"
            className="w-full p-2.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 text-sm"
          />
          <button
            onClick={() => {
              if (newText.text.trim()) {
                onAddText({ id: `custom_${Date.now()}`, ...newText })
                setNewText({ title: '短歌', text: '', author: '' })
                setAddMode(false)
              }
            }}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
          >
            追加
          </button>
        </div>
      )}

      {editing ? (
        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <textarea
            value={current.text}
            onChange={e => onEditText(activeIdx, 'text', e.target.value)}
            className="w-full p-2.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 text-sm min-h-[80px] resize-y"
          />
          <div className="flex gap-2 items-center">
            <input
              value={current.author || ''}
              onChange={e => onEditText(activeIdx, 'author', e.target.value)}
              placeholder="作者"
              className="flex-1 p-2 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 text-sm"
            />
            {current.id.startsWith('custom') && (
              <button onClick={() => { onRemoveText(activeIdx); setEditing(false) }} className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl p-5 border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-2">
            <span className={`text-xs font-bold ${passColors[activePass]}`}>{passLabels[activePass]}</span>
            {timer.running && <span className="text-xs font-mono text-blue-400">残{textTimeLeft}秒</span>}
          </div>
          <p className="text-lg text-slate-100 leading-loose font-medium">{current.text}</p>
          {current.author && <p className="text-right text-slate-500 text-sm mt-2 italic">— {current.author}</p>}
        </div>
      )}

      <MetronomeControl metro={metro} />
      <TimerDisplay timer={timer} metro={metro} />
    </div>
  )
}

function StepScript({
  timer, metro, scripts, onEditScript,
}: {
  timer: ReturnType<typeof useTimer>
  metro: ReturnType<typeof useMetronome>
  scripts: Scripts
  onEditScript: (key: string, value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const sections = [
    { key: 'intro' as const, label: '冒頭', borderColor: 'border-blue-500', textColor: 'text-blue-400' },
    { key: 'main' as const, label: '重要説明', borderColor: 'border-amber-500', textColor: 'text-amber-400' },
    { key: 'conclusion' as const, label: '結論', borderColor: 'border-green-500', textColor: 'text-green-400' },
  ]

  const passLabels = ['1回目: 普通に読む', '2回目: オーバーに口を使う', '3回目: 意味を伝えるつもりで']
  const initDuration = STEPS.find(s => s.id === 'script')!.duration

  // 文字数で比例配分
  const scriptTexts = sections.map(s => scripts[s.key])
  const totalChars = scriptTexts.reduce((sum, t) => sum + Math.max(t.length, 20), 0)
  const perPassDuration = Math.floor(initDuration / 3)
  const sectionDurations = sections.map((_, i) => {
    const chars = Math.max(scriptTexts[i].length, 20)
    return Math.max(8, Math.round(perPassDuration * (chars / totalChars)))
  })
  const sumPerPass = sectionDurations.reduce((s, d) => s + d, 0)
  sectionDurations[sectionDurations.length - 1] += perPassDuration - sumPerPass

  const elapsed = initDuration - timer.seconds
  const pass = Math.min(Math.floor(elapsed / perPassDuration), 2)
  const passElapsed = elapsed - pass * perPassDuration

  let autoSection = 0
  let sectionTimeLeft = 0
  let cum = 0
  for (let i = 0; i < sectionDurations.length; i++) {
    if (passElapsed < cum + sectionDurations[i]) {
      autoSection = i
      sectionTimeLeft = cum + sectionDurations[i] - passElapsed
      break
    }
    cum += sectionDurations[i]
    if (i === sectionDurations.length - 1) { autoSection = i; sectionTimeLeft = 0 }
  }

  const activeSection = timer.running || timer.done ? autoSection : 0
  const activePass = timer.running || timer.done ? pass : 0
  const cur = sections[activeSection]
  const passColors = ['text-slate-300', 'text-amber-400', 'text-green-400']

  return (
    <div className="space-y-4">
      <CoachPanel stepId="script" />

      {/* Pass indicator */}
      <div className="flex gap-1.5">
        {passLabels.map((l, i) => (
          <div
            key={i}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold text-center transition-colors ${
              i === activePass ? 'bg-blue-900 text-blue-200' : i < activePass ? 'bg-green-900/50 text-green-400' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5">
        {sections.map((s, i) => (
          <div
            key={s.key}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold text-center transition-colors ${
              i === activeSection ? `bg-slate-700 ${s.textColor}` : i < activeSection ? 'bg-green-900/30 text-green-500' : 'bg-slate-800 text-slate-600'
            }`}
          >
            {s.label}
          </div>
        ))}
        <button onClick={() => setEditing(!editing)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {editing ? (
        <textarea
          value={scripts[cur.key]}
          onChange={e => onEditScript(cur.key, e.target.value)}
          className="w-full p-3 rounded-xl bg-slate-900 text-slate-200 border border-slate-700 text-sm min-h-[120px] resize-y"
        />
      ) : (
        <div className={`bg-slate-800 rounded-xl p-5 border-l-4 ${cur.borderColor}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-xs font-bold ${passColors[activePass]}`}>{passLabels[activePass]}</span>
            {timer.running && <span className="text-xs font-mono text-blue-400">残{sectionTimeLeft}秒</span>}
          </div>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${cur.textColor}`}>台本: {cur.label}</p>
          <p className="text-slate-200 text-base leading-loose">{scripts[cur.key]}</p>
        </div>
      )}

      <MetronomeControl metro={metro} />
      <TimerDisplay timer={timer} metro={metro} />
    </div>
  )
}

function SaturdayDrillPicker({
  drills, selection, onSelect,
}: {
  drills: Record<string, DrillData>
  selection: string[] | null
  onSelect: React.Dispatch<React.SetStateAction<string[] | null>>
}) {
  if (selection) return null
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <p className="text-slate-500 text-xs mb-3">今週崩れた2系列を選んでください:</p>
      <div className="flex flex-wrap gap-2">
        {Object.keys(drills).map(k => (
          <button
            key={k}
            onClick={() => {
              onSelect(prev => {
                if (!prev) return [k]
                if (prev.length < 2 && !prev.includes(k)) return [...prev, k]
                return prev
              })
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-400"
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepDrill({
  timer, metro, drills, onEditDrill,
}: {
  timer: ReturnType<typeof useTimer>
  metro: ReturnType<typeof useMetronome>
  drills: Record<string, DrillData>
  onEditDrill: (key: string, field: string, value: string | string[]) => void
}) {
  const dayOfWeek = new Date().getDay()
  const dayName = DAY_NAMES[dayOfWeek]
  const scheduled = DRILL_SCHEDULE[dayOfWeek]
  const isSunday = dayOfWeek === 0
  const isSaturday = dayOfWeek === 6
  const [manualSelection, setManualSelection] = useState<string[] | null>(null)
  const [editing, setEditing] = useState(false)
  const todayDrills = manualSelection || scheduled || ['カ行', 'サ行']

  const initDuration = STEPS.find(s => s.id === 'drill')!.duration
  // 各ドリル内で 五十音(10秒) → 単語(10秒) → 短文(残り) の3段階
  const drillCount = todayDrills.length
  const perDrillDuration = Math.floor(initDuration / drillCount)
  const subSteps = [
    { label: '① 五十音', duration: 10 },
    { label: '② 実務単語', duration: 10 },
    { label: '③ 短文', duration: perDrillDuration - 20 },
  ]

  const elapsed = initDuration - timer.seconds
  const autoDrillIdx = Math.min(Math.floor(elapsed / perDrillDuration), drillCount - 1)
  const drillElapsed = elapsed - autoDrillIdx * perDrillDuration

  let autoSubStep = 0
  let subTimeLeft = 0
  let cum = 0
  for (let i = 0; i < subSteps.length; i++) {
    if (drillElapsed < cum + subSteps[i].duration) {
      autoSubStep = i
      subTimeLeft = cum + subSteps[i].duration - drillElapsed
      break
    }
    cum += subSteps[i].duration
    if (i === subSteps.length - 1) { autoSubStep = i; subTimeLeft = 0 }
  }

  const activeDrillIdx = timer.running || timer.done ? autoDrillIdx : 0
  const activeSubStep = timer.running || timer.done ? autoSubStep : -1
  const current = drills[todayDrills[activeDrillIdx]] || drills['カ行']

  if (isSunday) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <span className="text-5xl">😌</span>
        <p className="text-slate-400 text-lg">日曜日は休息日</p>
        <p className="text-slate-600 text-sm">録音だけでもOK</p>
      </div>
    )
  }

  const borderColors = ['border-indigo-400', 'border-violet-400', 'border-purple-400']

  return (
    <div className="space-y-4">
      <CoachPanel stepId="drill" />

      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">
          今日は<span className="text-white font-bold">{dayName}曜日</span>
          {isSaturday ? ' → 崩れた2系列を選択' : ` → ${todayDrills.join('・')}`}
        </span>
        <button onClick={() => setEditing(!editing)} className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {isSaturday && (
        <SaturdayDrillPicker drills={drills} selection={manualSelection} onSelect={setManualSelection} />
      )}

      {/* Drill tabs */}
      <div className="flex gap-2">
        {todayDrills.map((d, i) => (
          <div
            key={d}
            className={`flex-1 py-3 rounded-xl text-base font-bold text-center transition-colors ${
              i === activeDrillIdx ? 'bg-blue-900 text-blue-200' : i < activeDrillIdx ? 'bg-green-900/50 text-green-400' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {d}
            {timer.running && i === activeDrillIdx && <span className="ml-2 text-xs font-mono text-blue-400">残{subTimeLeft}秒</span>}
          </div>
        ))}
      </div>

      {editing ? (
        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <label className="text-slate-500 text-xs">単語（カンマ区切り）</label>
          <input
            value={current.words.join('、')}
            onChange={e => onEditDrill(todayDrills[activeDrillIdx], 'words', e.target.value.split(/[、,]/))}
            className="w-full p-2.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 text-sm"
          />
          <label className="text-slate-500 text-xs">短文</label>
          <input
            value={current.sentence}
            onChange={e => onEditDrill(todayDrills[activeDrillIdx], 'sentence', e.target.value)}
            className="w-full p-2.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 text-sm"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {[
            { label: '① 五十音', content: <p className="text-slate-200 text-xl tracking-[0.5em] font-light py-1">{current.sounds}</p> },
            { label: '② 実務単語', content: <p className="text-slate-200 text-lg py-0.5">{current.words.join('　　')}</p> },
            { label: '③ 短文', content: <p className="text-slate-200 text-base leading-relaxed py-0.5">{current.sentence}</p> },
          ].map((item, i) => (
            <div
              key={i}
              className={`bg-slate-800 rounded-xl p-4 border-l-4 ${borderColors[i]} transition-opacity ${
                activeSubStep >= 0 && activeSubStep !== i ? 'opacity-30' : ''
              }`}
            >
              <p className="text-xs font-bold text-blue-400 mb-1">{item.label}</p>
              {item.content}
            </div>
          ))}
        </div>
      )}

      <MetronomeControl metro={metro} />
      <TimerDisplay timer={timer} metro={metro} />
    </div>
  )
}

function StepRec2({
  timer, rec, evaluation, setEvaluation, history, themeIndex,
}: {
  timer: ReturnType<typeof useTimer>
  rec: ReturnType<typeof useRecorder>
  evaluation: Evaluation
  setEvaluation: (v: Evaluation) => void
  history: HistoryEntry[]
  themeIndex: number
}) {
  const prevRunning = useRef(false)
  useEffect(() => {
    if (timer.running && !prevRunning.current && !rec.recording) rec.start()
    if (!timer.running && prevRunning.current && rec.recording) rec.stop()
    prevRunning.current = timer.running
  }, [timer.running, rec])

  const metrics = [
    { key: 'clarity' as const, label: '明瞭度', desc: 'はっきり聞こえるか', color: 'bg-blue-600' },
    { key: 'ease' as const, label: '楽さ', desc: 'のどに負担がないか', color: 'bg-green-600' },
    { key: 'hoarseness' as const, label: '掠れ', desc: '掠れが少ないか（5=なし）', color: 'bg-amber-600' },
  ]

  return (
    <div className="space-y-4">
      <CoachPanel stepId="rec2" />
      <RecThemeCard themeIndex={themeIndex} />
      <RecorderControl rec={rec} label="after" />
      <TimerDisplay timer={timer} />

      <div className="bg-slate-800 rounded-xl p-5 space-y-5">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-400">自己評価（5点満点）</p>
        {metrics.map(({ key, label, desc, color }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="min-w-[60px]">
              <p className="text-sm font-semibold text-slate-200">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
            <div className="flex gap-1.5 flex-1">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  onClick={() => setEvaluation({ ...evaluation, [key]: v })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    evaluation[key] === v ? `${color} text-white` : 'bg-slate-900 text-slate-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {history.length > 1 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">推移グラフ</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#94a3b8' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="clarity" name="明瞭度" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="ease" name="楽さ" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="hoarseness" name="掠れ" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [texts, setTexts] = useState(DEFAULT_TEXTS)
  const [selectedText, setSelectedText] = useState(0)
  const [scripts, setScripts] = useState(DEFAULT_SCRIPTS)
  const [drills, setDrills] = useState(DEFAULT_DRILLS)
  const [evaluation, setEvaluation] = useState<Evaluation>({ clarity: 3, ease: 3, hoarseness: 3 })
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [sessionComplete, setSessionComplete] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const timer = useTimer(STEPS[currentStep].duration)
  const metro = useMetronome()
  const rec1 = useRecorder()
  const rec2 = useRecorder()

  const step = STEPS[currentStep]
  const dayOfWeek = new Date().getDay()
  const dayName = DAY_NAMES[dayOfWeek]
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const recThemeIndex = dayOfYear % REC_THEMES.length

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      metro.stop()
      const next = currentStep + 1
      setCurrentStep(next)
      timer.reset(STEPS[next].duration)
    } else {
      const today = new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
      setHistory(h => [...h, { date: today, ...evaluation }])
      setSessionComplete(true)
      metro.stop()
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      metro.stop()
      const prev = currentStep - 1
      setCurrentStep(prev)
      timer.reset(STEPS[prev].duration)
    }
  }

  const resetSession = () => {
    setCurrentStep(0)
    timer.reset(STEPS[0].duration)
    setSessionComplete(false)
    setEvaluation({ clarity: 3, ease: 3, hoarseness: 3 })
    rec1.clear()
    rec2.clear()
    metro.stop()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        if (sessionComplete) return
        if (showHistory) return
        if (timer.done) {
          goNext()
        } else {
          timer.toggle()
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        if (!sessionComplete && !showHistory) goNext()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        if (!sessionComplete && !showHistory) goPrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const onEditText = (idx: number, field: string, value: string) => {
    setTexts(t => t.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }
  const onAddText = (item: TextItem) => { setTexts(t => [...t, item]); setSelectedText(texts.length) }
  const onRemoveText = (idx: number) => {
    setTexts(t => t.filter((_, i) => i !== idx))
    setSelectedText(Math.max(0, idx - 1))
  }
  const onEditScript = (key: string, value: string) => setScripts(s => ({ ...s, [key]: value }))
  const onEditDrill = (key: string, field: string, value: string | string[]) => setDrills(d => ({ ...d, [key]: { ...d[key], [field]: value } }))

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify({ history, texts, scripts, drills }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `voice-training_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  // ── Session Complete View ──
  if (sessionComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-200">
        <div className="max-w-md w-full space-y-6 text-center">
          <span className="text-5xl block">✨</span>
          <h1 className="text-2xl font-bold">セッション完了</h1>
          <p className="text-slate-400">お疲れさまでした。</p>

          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">今日の大原則</p>
            <p className="text-blue-300 text-base font-semibold">楽に、前に、はっきり。</p>
            <p className="text-slate-400 text-xs mt-1">「上手く話す」ではなく「楽にはっきり」が受診前の正解。</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 flex justify-around">
            {[
              { label: '明瞭度', value: evaluation.clarity, color: 'text-blue-400' },
              { label: '楽さ', value: evaluation.ease, color: 'text-green-400' },
              { label: '掠れ', value: evaluation.hoarseness, color: 'text-amber-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-3xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          {history.length > 1 && (
            <div className="bg-slate-800 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="clarity" name="明瞭度" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="ease" name="楽さ" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="hoarseness" name="掠れ" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={resetSession} className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> もう一度
            </button>
            <button onClick={exportHistory} className="flex-1 py-3.5 rounded-xl bg-slate-700 text-slate-300 font-semibold hover:bg-slate-600 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> データ保存
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── History View ──
  if (showHistory) {
    return (
      <div className="min-h-screen p-6 bg-slate-900 text-slate-200">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">トレーニング履歴</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          {history.length === 0 ? (
            <p className="text-slate-600 text-center py-16">まだ記録がありません</p>
          ) : (
            <>
              <div className="bg-slate-800 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="clarity" name="明瞭度" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ease" name="楽さ" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="hoarseness" name="掠れ" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {history.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                  <span className="text-sm">{h.date}</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-blue-400">明瞭 {h.clarity}</span>
                    <span className="text-green-400">楽さ {h.ease}</span>
                    <span className="text-amber-400">掠れ {h.hoarseness}</span>
                  </div>
                </div>
              ))}
              <button onClick={exportHistory} className="w-full py-2.5 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> JSONエクスポート
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Main Training View ──
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* Header */}
      <header className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-400" />
            発声トレーニング
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{dayName}曜日 ・ 約10分</p>
        </div>
        <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-400 text-xs hover:bg-slate-600">
          <BarChart3 className="w-3.5 h-3.5" /> 履歴
        </button>
      </header>

      {/* Step Progress */}
      <div className="flex px-3 py-2.5 gap-1 overflow-x-auto bg-slate-900">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setCurrentStep(i); timer.reset(s.duration); metro.stop() }}
            className="flex flex-col items-center gap-1 flex-1 min-w-0"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              i === currentStep ? 'bg-blue-600 text-white' : i < currentStep ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {i < currentStep ? <Check className="w-4 h-4" /> : s.icon}
            </div>
            <span className={`text-[9px] text-center w-full truncate ${
              i === currentStep ? 'text-slate-200' : 'text-slate-600'
            }`}>
              {s.title.split('. ')[1] || s.title}
            </span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <main className="p-4 max-w-lg mx-auto">
        <h2 className="text-base font-bold mb-4 text-slate-100">
          {step.icon} {step.title}
        </h2>

        {currentStep === 0 && <StepPrep timer={timer} />}
        {currentStep === 1 && <StepRec1 timer={timer} rec={rec1} themeIndex={recThemeIndex} />}
        {currentStep === 2 && <StepWarmup timer={timer} />}
        {currentStep === 3 && (
          <StepReading
            timer={timer} metro={metro} texts={texts}
            selectedText={selectedText} setSelectedText={setSelectedText}
            onEditText={onEditText} onAddText={onAddText} onRemoveText={onRemoveText}
          />
        )}
        {currentStep === 4 && <StepScript timer={timer} metro={metro} scripts={scripts} onEditScript={onEditScript} />}
        {currentStep === 5 && <StepDrill timer={timer} metro={metro} drills={drills} onEditDrill={onEditDrill} />}
        {currentStep === 6 && <StepRec2 timer={timer} rec={rec2} evaluation={evaluation} setEvaluation={setEvaluation} history={history} themeIndex={recThemeIndex} />}

      </main>

      {/* Fixed side navigation — anchored to the content column edges */}
      <div className="fixed top-1/2 -translate-y-1/2 left-0 right-0 max-w-[calc(32rem+7rem)] mx-auto flex justify-between pointer-events-none z-10 px-2">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="pointer-events-auto w-11 h-11 rounded-full bg-slate-700/80 backdrop-blur text-slate-300 flex items-center justify-center shadow-lg transition-all hover:bg-slate-600 disabled:opacity-0 disabled:pointer-events-none"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          className="pointer-events-auto w-11 h-11 rounded-full bg-blue-600/80 backdrop-blur text-white flex items-center justify-center shadow-lg transition-all hover:bg-blue-700"
        >
          {currentStep === STEPS.length - 1 ? <Check className="w-5 h-5" /> : <SkipForward className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}
