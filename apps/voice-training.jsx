import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ── Data Constants ──────────────────────────────────────────────────────────

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

const DRILL_SCHEDULE = {
  1: ["カ行", "サ行"],
  2: ["タ行", "ラ行"],
  3: ["カ行", "ハ行"],
  4: ["サ行", "ラ行"],
  5: ["タ行", "ハ行"],
  6: null,
  0: null,
};

const DEFAULT_DRILLS = {
  カ行: { sounds: "か き く け こ", words: ["確認", "共有"], sentence: "確認事項を共有します" },
  サ行: { sounds: "さ し す せ そ", words: ["資料", "仕様"], sentence: "資料の要点を説明します" },
  タ行: { sounds: "た ち つ て と", words: ["対応", "手順"], sentence: "対応手順を確認します" },
  ラ行: { sounds: "ら り る れ ろ", words: ["理由", "理解"], sentence: "理由を整理して説明します" },
  ハ行: { sounds: "は ひ ふ へ ほ", words: ["方針", "発表"], sentence: "方針を発表します" },
};

const DEFAULT_TEXTS = [
  { id: "tanka1", title: "短歌", text: "この味がいいねと君が言ったから七月六日はサラダ記念日", author: "俵万智" },
  { id: "tanka2", title: "短歌", text: "くれなゐの二尺伸びたる薔薇の芽の針やはらかに春雨のふる", author: "正岡子規" },
  { id: "meigen1", title: "名言", text: "為せば成る、為さねば成らぬ何事も、成らぬは人の為さぬなりけり。", author: "上杉鷹山" },
  { id: "tsurezure", title: "古典", text: "つれづれなるままに、日暮らし硯に向かひて、心にうつりゆくよしなしごとを、そこはかとなく書きつくれば、あやしうこそものぐるほしけれ。", author: "吉田兼好" },
  { id: "hojoki", title: "古典", text: "ゆく河の流れは絶えずして、しかももとの水にあらず。よどみに浮かぶうたかたは、かつ消えかつ結びて、久しくとどまりたるためしなし。", author: "鴨長明" },
];

const DEFAULT_SCRIPTS = {
  intro: "本日はお時間をいただきありがとうございます。これから、Expert AX - Level1（Claude Code）を全4回、2ヶ月ほどに渡ってお付き合いいただきます。第1回のテーマは『Claude Code活用の基礎』です。AIを安全に使いこなすための土台を作る内容になっています。",
  main: "まず、この研修のゴールをお伝えします。Claude Codeというツールを軸にして、AIエージェントを使いこなす技術と知識を獲得してもらうこと、これがこの研修のゴールです。",
  conclusion: "本日のまとめです。今日お伝えした要点は3つです。ひとつずつ振り返ります。",
};

const STEPS = [
  { id: "prep", title: "0. 事前準備", duration: 15, icon: "💧" },
  { id: "rec1", title: "1. 最初の録音", duration: 40, icon: "🎙️" },
  { id: "warmup", title: "2. 発声ウォームアップ", duration: 90, icon: "🫁" },
  { id: "reading", title: "3. 教養テキスト音読", duration: 180, icon: "📖" },
  { id: "script", title: "4. 研修台本ブロック", duration: 180, icon: "🎯" },
  { id: "drill", title: "5. 子音ドリル", duration: 90, icon: "👄" },
  { id: "rec2", title: "6. 最後の録音＋評価", duration: 50, icon: "📊" },
];

// ── Coach Notes per step ────────────────────────────────────────────────────

const COACH = {
  prep: {
    why: "声を出す前の状態を整える。脱水はすぐ声に出る。",
    focus: ["水をひと口", "胸を張りすぎず、首を前に出さない", "声量は「会議室の1対1」くらい"],
    warn: "のど払いしたくなったら、まず唾か水を飲む（のど払いは声帯に負担）",
  },
  rec1: {
    why: "毎日の「素の状態」を記録して、afterと比較する。改善は数字ではなく聴き比べでわかる。",
    focus: ["毎日同じテーマで録る（導入/自己紹介/結論のどれか固定）", "直そうとしない、普段の話し方で", "30〜40秒だけ"],
    warn: null,
  },
  warmup: {
    why: "のどを押さずに「声を前に集める感覚」を作る。ASHA resonant voice therapyの導入部分。",
    focus: ["のどを絞めない", "口の前〜唇あたりに響く感じを探す", "大声は絶対NG"],
    warn: "練習後に余計に枯れたら、力が入りすぎ。もっと小さく・楽にやる。",
  },
  reading: {
    why: "Clear speechの訓練。「はっきり話して」より「オーバーに口を使って（overenunciate）」のほうが明瞭度改善が大きい（ASHA dysarthria研究）。",
    focus: ["母音を潰さない", "語尾を消さない", "子音を先に当ててから母音に抜く", "句読点でちゃんと切る"],
    warn: "スピードを上げて「うまく読もう」としない。声を張ってごまかさない。",
    bpm: "54〜60 BPMで開始。1拍＝1文節（1音じゃない）。例:「秋の田の / かりほの / 庵の」＝ カチ/カチ/カチ。遅すぎたら63、雑になったら50台に戻す。",
  },
  script: {
    why: "実際に使う文で練習→本番への転移率が高い（ASHA: functional communication + motor learning）。受診前は台本練習が最優先。",
    focus: ["意味の塊で区切る（例:「今日は / まず結論を / お話しします」）", "1文が長すぎるものは削る", "漢語が続く部分は区切りを入れる", "専門用語はそのまま使うが前後を短くする"],
    warn: null,
    bpm: "54〜60 BPMで開始。1拍＝1意味の塊。専門語が詰まるときに使う。常用ではなく補助。",
  },
  drill: {
    why: "全部を毎日やらない。少数の音を、位置を意識して、単語→短文まで繋げる（ASHA: phonetic placement + minimal contrasts）。",
    focus: ["音だけで終わらず、必ず単語→短文まで行く", "速くしない", "きれいに言おうとしすぎず、舌や唇の位置をはっきり取る"],
    warn: "子音が連続して崩れるときにメトロノームを使う。",
    bpm: "崩れるときだけ使う。54〜60 BPM。語尾が消えるときにも有効。",
  },
  rec2: {
    why: "beforeと聴き比べて変化を確認。点数化はざっくりでいい。",
    focus: ["語尾が残っているか", "こもりが少し減ったか", "子音が前より立っているか"],
    warn: null,
  },
};

// ── Utility Hooks ───────────────────────────────────────────────────────────

function useTimer(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, seconds]);

  const reset = (s) => { setSeconds(s); setRunning(false); };
  const toggle = () => setRunning((r) => !r);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return { seconds, running, toggle, reset, formatted: fmt(seconds), done: seconds === 0 };
}

function useMetronome() {
  const [bpm, setBpm] = useState(57);
  const [active, setActive] = useState(false);
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  const playClick = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 900;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, []);

  useEffect(() => {
    if (active) {
      playClick();
      intervalRef.current = setInterval(playClick, (60 / bpm) * 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [active, bpm, playClick]);

  return { bpm, setBpm, active, toggle: () => setActive((a) => !a), stop: () => setActive(false) };
}

function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Recording failed:", err);
    }
  };

  const stop = () => {
    if (mediaRef.current && recording) { mediaRef.current.stop(); setRecording(false); }
  };

  const download = (filename) => {
    if (!audioBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(audioBlob);
    a.download = filename;
    a.click();
  };

  const clear = () => { setAudioUrl(null); setAudioBlob(null); };
  return { recording, audioUrl, audioBlob, start, stop, download, clear };
}

// ── Shared UI Components ────────────────────────────────────────────────────

const S = {
  card: { backgroundColor: "#1e293b", borderRadius: 8, padding: 16 },
  coachBox: { backgroundColor: "#172554", border: "1px solid #1e40af", borderRadius: 10, padding: 16, marginBottom: 8 },
  coachTitle: { color: "#60a5fa", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  focusPill: { display: "inline-block", backgroundColor: "#1e3a5f", color: "#93c5fd", fontSize: 12, padding: "4px 10px", borderRadius: 6, margin: "2px 4px 2px 0" },
  warnBox: { backgroundColor: "#422006", border: "1px solid #92400e", borderRadius: 8, padding: 10, marginTop: 8 },
  warnText: { color: "#fbbf24", fontSize: 12 },
  bpmBox: { backgroundColor: "#1a2332", border: "1px solid #334155", borderRadius: 8, padding: 10, marginTop: 8 },
  bpmText: { color: "#94a3b8", fontSize: 12, lineHeight: 1.6 },
  whyText: { color: "#cbd5e1", fontSize: 13, lineHeight: 1.6, marginBottom: 8 },
  sectionLabel: { color: "#60a5fa", fontSize: 11, fontWeight: 700, marginBottom: 4 },
  textBody: { color: "#e2e8f0", fontSize: 15, lineHeight: 1.7 },
  textAuthor: { color: "#64748b", fontSize: 12, marginTop: 4, textAlign: "right" },
  dimText: { color: "#64748b", fontSize: 12 },
  btn: (active, color = "#3b82f6") => ({
    backgroundColor: active ? color : "#1e293b",
    color: active ? "#fff" : "#94a3b8",
    border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer",
  }),
};

function CoachPanel({ stepId }) {
  const c = COACH[stepId];
  if (!c) return null;
  return (
    <div style={S.coachBox}>
      <div style={S.coachTitle}>COACH</div>
      <div style={S.whyText}>{c.why}</div>
      <div style={{ ...S.coachTitle, marginTop: 8 }}>意識すること</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {c.focus.map((f, i) => <span key={i} style={S.focusPill}>{f}</span>)}
      </div>
      {c.warn && (
        <div style={S.warnBox}>
          <div style={S.warnText}>⚠ {c.warn}</div>
        </div>
      )}
      {c.bpm && (
        <div style={S.bpmBox}>
          <div style={{ ...S.coachTitle, color: "#94a3b8" }}>BPMガイド</div>
          <div style={S.bpmText}>{c.bpm}</div>
        </div>
      )}
    </div>
  );
}

function TimerDisplay({ timer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, margin: "16px 0" }}>
      <div style={{ fontSize: 40, fontFamily: "monospace", fontWeight: 700, color: timer.done ? "#22c55e" : timer.running ? "#3b82f6" : "#64748b" }}>
        {timer.formatted}
      </div>
      <button
        onClick={timer.toggle}
        style={{ padding: "8px 28px", borderRadius: 8, border: "none", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", backgroundColor: timer.running ? "#ef4444" : timer.done ? "#22c55e" : "#3b82f6" }}
      >
        {timer.done ? "✓ 完了" : timer.running ? "⏸ 一時停止" : "▶ スタート"}
      </button>
    </div>
  );
}

function MetronomeControl({ metro }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, backgroundColor: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
      <button
        onClick={metro.toggle}
        style={{ width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, backgroundColor: metro.active ? "#ef4444" : "#334155", color: "#fff" }}
      >
        {metro.active ? "■" : "♩"}
      </button>
      <input type="range" min={40} max={80} value={metro.bpm} onChange={(e) => metro.setBpm(Number(e.target.value))} style={{ flex: 1, accentColor: "#3b82f6" }} />
      <span style={{ fontSize: 14, fontFamily: "monospace", color: "#e2e8f0", minWidth: 60, textAlign: "right" }}>{metro.bpm} BPM</span>
    </div>
  );
}

function RecorderControl({ rec, label }) {
  return (
    <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={rec.recording ? rec.stop : rec.start}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", backgroundColor: rec.recording ? "#ef4444" : "#dc2626" }}
        >
          {rec.recording ? "⏹ 録音停止" : "⏺ 録音開始"}
        </button>
        {rec.recording && <span style={{ color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>● 録音中...</span>}
      </div>
      {rec.audioUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <audio controls src={rec.audioUrl} style={{ width: "100%", height: 40 }} />
          <button
            onClick={() => rec.download(`${label}_${new Date().toISOString().slice(0, 10)}.webm`)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "none", backgroundColor: "#334155", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}
          >
            ⬇ ダウンロード保存
          </button>
        </div>
      )}
    </div>
  );
}

function PassGuide({ pass, setPass }) {
  const labels = ["1回目: 普通に読む", "2回目: オーバーに口を使う", "3回目: 意味を伝えるつもりで"];
  const colors = ["#94a3b8", "#f59e0b", "#22c55e"];
  return (
    <div style={{ display: "flex", gap: 4, margin: "12px 0" }}>
      {labels.map((l, i) => (
        <button
          key={i} onClick={() => setPass(i)}
          style={{
            flex: 1, textAlign: "center", padding: "10px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: i === pass ? `2px solid ${colors[i]}` : "2px solid transparent",
            backgroundColor: i === pass ? colors[i] + "22" : "#0f172a", color: i === pass ? colors[i] : "#475569",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// ── Step Content Components ─────────────────────────────────────────────────

function StepPrep({ timer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <CoachPanel stepId="prep" />
      <TimerDisplay timer={timer} />
    </div>
  );
}

function StepRec1({ timer, rec }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <CoachPanel stepId="rec1" />
      <RecorderControl rec={rec} label="before" />
      <TimerDisplay timer={timer} />
    </div>
  );
}

function StepWarmup({ timer }) {
  const [phase, setPhase] = useState(0);
  const phases = [
    { title: "① 無声の息 ×3回", desc: "鼻から吸って、口から静かに吐く。1回3秒くらい。" },
    { title: "② 「んー」×5回", desc: "2秒ずつ。口は軽く閉じ、唇か前歯の裏あたりが少し振動する感じを探す。声は小さすぎず大きすぎず。" },
    { title: "③ 「んーま」「んーみ」「んーむ」各2回", desc: "「ん」の楽さを保ったまま、後ろの音を足す。きつくなるならすぐ戻す。" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <CoachPanel stepId="warmup" />
      <div style={{ display: "flex", gap: 4 }}>
        {phases.map((p, i) => (
          <button key={i} onClick={() => setPhase(i)} style={{ ...S.btn(i === phase, "#1e40af"), flex: 1, padding: "10px 4px" }}>{p.title}</button>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.textBody}>{phases[phase].desc}</div>
      </div>
      <TimerDisplay timer={timer} />
    </div>
  );
}

function StepReading({ timer, metro, texts, selectedText, setSelectedText, onEditText, onAddText, onRemoveText }) {
  const [pass, setPass] = useState(0);
  const [editing, setEditing] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newText, setNewText] = useState({ title: "短歌", text: "", author: "" });
  const current = texts[selectedText] || texts[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <CoachPanel stepId="reading" />

      {/* Text selector */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {texts.map((t, i) => (
          <button key={t.id} onClick={() => setSelectedText(i)} style={S.btn(i === selectedText)}>
            {t.title === "短歌" ? "歌" : t.title === "名言" ? "言" : "古"}{t.author ? ` ${t.author.slice(0, 3)}` : ""}
          </button>
        ))}
        <button onClick={() => setAddMode(!addMode)} style={{ ...S.btn(false), fontSize: 16, padding: "4px 10px" }}>＋</button>
        <button onClick={() => setEditing(!editing)} style={{ ...S.btn(false), fontSize: 13 }}>✎</button>
      </div>

      {/* Add new text */}
      {addMode && (
        <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["短歌", "名言", "古典"].map((t) => (
              <button key={t} onClick={() => setNewText({ ...newText, title: t })} style={S.btn(newText.title === t)}>{t}</button>
            ))}
          </div>
          <textarea
            value={newText.text} onChange={(e) => setNewText({ ...newText, text: e.target.value })}
            placeholder="テキストを入力..."
            style={{ width: "100%", padding: 8, borderRadius: 6, backgroundColor: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", fontSize: 14, minHeight: 60, boxSizing: "border-box" }}
          />
          <input
            value={newText.author} onChange={(e) => setNewText({ ...newText, author: e.target.value })}
            placeholder="作者（任意）"
            style={{ width: "100%", padding: 8, borderRadius: 6, backgroundColor: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", fontSize: 13, boxSizing: "border-box" }}
          />
          <button
            onClick={() => {
              if (newText.text.trim()) {
                onAddText({ id: `custom_${Date.now()}`, ...newText });
                setNewText({ title: "短歌", text: "", author: "" });
                setAddMode(false);
              }
            }}
            style={{ ...S.btn(true, "#22c55e"), padding: "8px 16px", alignSelf: "flex-start" }}
          >
            追加
          </button>
        </div>
      )}

      {/* Display / Edit text */}
      {editing ? (
        <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 6 }}>
          <textarea
            value={current.text}
            onChange={(e) => onEditText(selectedText, "text", e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 6, backgroundColor: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", fontSize: 14, minHeight: 80, boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              value={current.author || ""}
              onChange={(e) => onEditText(selectedText, "author", e.target.value)}
              placeholder="作者"
              style={{ flex: 1, padding: 6, borderRadius: 6, backgroundColor: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", fontSize: 13 }}
            />
            {current.id.startsWith("custom") && (
              <button onClick={() => { onRemoveText(selectedText); setEditing(false); }} style={{ ...S.btn(true, "#ef4444"), fontSize: 11 }}>削除</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ ...S.card, borderLeft: "3px solid #3b82f6" }}>
          <div style={{ ...S.textBody, fontSize: 18, lineHeight: 2 }}>{current.text}</div>
          {current.author && <div style={S.textAuthor}>— {current.author}</div>}
        </div>
      )}

      <PassGuide pass={pass} setPass={setPass} />

      <MetronomeControl metro={metro} />
      <TimerDisplay timer={timer} />
    </div>
  );
}

function StepScript({ timer, metro, scripts, onEditScript }) {
  const [pass, setPass] = useState(0);
  const [editing, setEditing] = useState(false);
  const sections = [
    { key: "intro", label: "冒頭", color: "#3b82f6" },
    { key: "main", label: "重要説明", color: "#f59e0b" },
    { key: "conclusion", label: "結論", color: "#22c55e" },
  ];
  const [section, setSection] = useState(0);
  const cur = sections[section];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <CoachPanel stepId="script" />

      <div style={{ display: "flex", gap: 4 }}>
        {sections.map((s, i) => (
          <button key={s.key} onClick={() => setSection(i)} style={{ ...S.btn(i === section, s.color), flex: 1, padding: "10px 4px" }}>{s.label}</button>
        ))}
        <button onClick={() => setEditing(!editing)} style={{ ...S.btn(false), fontSize: 13 }}>✎</button>
      </div>

      {editing ? (
        <textarea
          value={scripts[cur.key]}
          onChange={(e) => onEditScript(cur.key, e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, backgroundColor: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", fontSize: 14, minHeight: 120, boxSizing: "border-box" }}
        />
      ) : (
        <div style={{ ...S.card, borderLeft: `3px solid ${cur.color}` }}>
          <div style={{ ...S.sectionLabel, color: cur.color }}>台本: {cur.label}</div>
          <div style={{ ...S.textBody, fontSize: 16, lineHeight: 1.9 }}>{scripts[cur.key]}</div>
        </div>
      )}

      <PassGuide pass={pass} setPass={setPass} />

      <MetronomeControl metro={metro} />
      <TimerDisplay timer={timer} />
    </div>
  );
}

function StepDrill({ timer, metro, drills, onEditDrill }) {
  const dayOfWeek = new Date().getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  const scheduled = DRILL_SCHEDULE[dayOfWeek];
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const [manualSelection, setManualSelection] = useState(null);
  const [editing, setEditing] = useState(false);
  const todayDrills = manualSelection || scheduled || ["カ行", "サ行"];
  const [activeDrill, setActiveDrill] = useState(0);
  const current = drills[todayDrills[activeDrill]] || drills["カ行"];

  if (isSunday) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 48 }}>😌</div>
        <p style={{ color: "#94a3b8", fontSize: 18 }}>日曜日は休息日</p>
        <p style={{ color: "#64748b", fontSize: 13 }}>録音だけでもOK</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <CoachPanel stepId="drill" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>
          今日は<span style={{ color: "#fff", fontWeight: 700 }}>{dayName}曜日</span>
          {isSaturday ? " → 崩れた2系列を選択" : ` → ${todayDrills.join("・")}`}
        </span>
        <button onClick={() => setEditing(!editing)} style={{ ...S.btn(false), fontSize: 13 }}>✎</button>
      </div>

      {(isSaturday && !manualSelection) && (
        <div style={{ ...S.card, display: "flex", flexWrap: "wrap", gap: 6 }}>
          <div style={{ ...S.dimText, width: "100%", marginBottom: 4 }}>今週崩れた2系列を選んでください:</div>
          {Object.keys(drills).map((k) => (
            <button key={k} onClick={() => {
              if (!manualSelection) setManualSelection([k]);
              else if (manualSelection.length < 2 && !manualSelection.includes(k)) setManualSelection([...manualSelection, k]);
            }} style={S.btn(manualSelection?.includes(k))}>{k}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 4 }}>
        {todayDrills.map((d, i) => (
          <button key={d} onClick={() => setActiveDrill(i)} style={{ ...S.btn(i === activeDrill, "#1e40af"), flex: 1, padding: "12px 4px", fontSize: 16, fontWeight: 700 }}>{d}</button>
        ))}
      </div>

      {editing ? (
        <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={S.dimText}>単語（カンマ区切り）</label>
          <input
            value={current.words.join("、")}
            onChange={(e) => onEditDrill(todayDrills[activeDrill], "words", e.target.value.split(/[、,]/))}
            style={{ width: "100%", padding: 8, borderRadius: 6, backgroundColor: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", fontSize: 14, boxSizing: "border-box" }}
          />
          <label style={S.dimText}>短文</label>
          <input
            value={current.sentence}
            onChange={(e) => onEditDrill(todayDrills[activeDrill], "sentence", e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 6, backgroundColor: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", fontSize: 14, boxSizing: "border-box" }}
          />
        </div>
      ) : (
        <>
          <div style={{ ...S.card, borderLeft: "3px solid #818cf8" }}>
            <div style={S.sectionLabel}>① 五十音</div>
            <div style={{ color: "#e2e8f0", fontSize: 22, letterSpacing: 8, fontWeight: 300, padding: "8px 0" }}>{current.sounds}</div>
          </div>
          <div style={{ ...S.card, borderLeft: "3px solid #a78bfa" }}>
            <div style={S.sectionLabel}>② 実務単語</div>
            <div style={{ color: "#e2e8f0", fontSize: 18, padding: "4px 0" }}>{current.words.join("　　")}</div>
          </div>
          <div style={{ ...S.card, borderLeft: "3px solid #c084fc" }}>
            <div style={S.sectionLabel}>③ 短文</div>
            <div style={{ color: "#e2e8f0", fontSize: 16, lineHeight: 1.8, padding: "4px 0" }}>{current.sentence}</div>
          </div>
        </>
      )}

      <MetronomeControl metro={metro} />
      <TimerDisplay timer={timer} />
    </div>
  );
}

function StepRec2({ timer, rec, evaluation, setEvaluation, history }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <CoachPanel stepId="rec2" />
      <RecorderControl rec={rec} label="after" />
      <TimerDisplay timer={timer} />

      <div style={S.card}>
        <div style={{ ...S.coachTitle, fontSize: 13, marginBottom: 12 }}>自己評価（5点満点）</div>
        {[
          { key: "clarity", label: "明瞭度", desc: "はっきり聞こえるか", color: "#3b82f6" },
          { key: "ease", label: "楽さ", desc: "のどに負担がないか", color: "#22c55e" },
          { key: "hoarseness", label: "掠れ", desc: "掠れが少ないか（5=なし）", color: "#f59e0b" },
        ].map(({ key, label, desc, color }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ minWidth: 64 }}>
              <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>{label}</div>
              <div style={S.dimText}>{desc}</div>
            </div>
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v} onClick={() => setEvaluation({ ...evaluation, [key]: v })}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 16, fontWeight: 700,
                    backgroundColor: evaluation[key] === v ? color : "#0f172a",
                    color: evaluation[key] === v ? "#fff" : "#475569",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {history.length > 1 && (
        <div style={S.card}>
          <div style={{ ...S.coachTitle, marginBottom: 8 }}>推移グラフ</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} labelStyle={{ color: "#94a3b8" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="clarity" name="明瞭度" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="ease" name="楽さ" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="hoarseness" name="掠れ" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────

export default function VoiceTrainingApp() {
  const [currentStep, setCurrentStep] = useState(0);
  const [texts, setTexts] = useState(DEFAULT_TEXTS);
  const [selectedText, setSelectedText] = useState(0);
  const [scripts, setScripts] = useState(DEFAULT_SCRIPTS);
  const [drills, setDrills] = useState(DEFAULT_DRILLS);
  const [evaluation, setEvaluation] = useState({ clarity: 3, ease: 3, hoarseness: 3 });
  const [history, setHistory] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const timer = useTimer(STEPS[currentStep].duration);
  const metro = useMetronome();
  const rec1 = useRecorder();
  const rec2 = useRecorder();

  const step = STEPS[currentStep];
  const dayOfWeek = new Date().getDay();
  const dayName = DAY_NAMES[dayOfWeek];

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      metro.stop();
      const next = currentStep + 1;
      setCurrentStep(next);
      timer.reset(STEPS[next].duration);
    } else {
      const today = new Date().toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
      setHistory((h) => [...h, { date: today, ...evaluation }]);
      setSessionComplete(true);
      metro.stop();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      metro.stop();
      const prev = currentStep - 1;
      setCurrentStep(prev);
      timer.reset(STEPS[prev].duration);
    }
  };

  const resetSession = () => {
    setCurrentStep(0);
    timer.reset(STEPS[0].duration);
    setSessionComplete(false);
    setEvaluation({ clarity: 3, ease: 3, hoarseness: 3 });
    rec1.clear();
    rec2.clear();
    metro.stop();
  };

  const onEditText = (idx, field, value) => {
    setTexts((t) => t.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };
  const onAddText = (item) => { setTexts((t) => [...t, item]); setSelectedText(texts.length); };
  const onRemoveText = (idx) => {
    setTexts((t) => t.filter((_, i) => i !== idx));
    setSelectedText(Math.max(0, idx - 1));
  };
  const onEditScript = (key, value) => setScripts((s) => ({ ...s, [key]: value }));
  const onEditDrill = (key, field, value) => setDrills((d) => ({ ...d, [key]: { ...d[key], [field]: value } }));

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify({ history, texts, scripts, drills }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `voice-training_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  // ── Session Complete ──
  if (sessionComplete) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0f172a", color: "#e2e8f0" }}>
        <div style={{ maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", gap: 20, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✨</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>セッション完了</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>お疲れさまでした。</p>
          <div style={{ ...S.coachBox, textAlign: "left" }}>
            <div style={S.coachTitle}>今日の大原則</div>
            <div style={{ color: "#93c5fd", fontSize: 15, fontWeight: 600 }}>楽に、前に、はっきり。</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>「上手く話す」ではなく「楽にはっきり」が受診前の正解。</div>
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {[
                { label: "明瞭度", value: evaluation.clarity, color: "#3b82f6" },
                { label: "楽さ", value: evaluation.ease, color: "#22c55e" },
                { label: "掠れ", value: evaluation.hoarseness, color: "#f59e0b" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          {history.length > 1 && (
            <div style={S.card}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="clarity" name="明瞭度" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="ease" name="楽さ" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="hoarseness" name="掠れ" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={resetSession} style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", backgroundColor: "#3b82f6", color: "#fff" }}>もう一度</button>
            <button onClick={exportHistory} style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", backgroundColor: "#334155", color: "#94a3b8" }}>データ保存</button>
          </div>
        </div>
      </div>
    );
  }

  // ── History View ──
  if (showHistory) {
    return (
      <div style={{ minHeight: "100vh", padding: 24, backgroundColor: "#0f172a", color: "#e2e8f0" }}>
        <div style={{ maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>トレーニング履歴</h2>
            <button onClick={() => setShowHistory(false)} style={{ ...S.btn(false), padding: "6px 14px" }}>戻る</button>
          </div>
          {history.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: 32 }}>まだ記録がありません</p>
          ) : (
            <>
              <div style={S.card}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="clarity" name="明瞭度" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ease" name="楽さ" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="hoarseness" name="掠れ" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {history.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#1e293b", borderRadius: 8 }}>
                  <span style={{ fontSize: 13 }}>{h.date}</span>
                  <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                    <span style={{ color: "#3b82f6" }}>明瞭 {h.clarity}</span>
                    <span style={{ color: "#22c55e" }}>楽さ {h.ease}</span>
                    <span style={{ color: "#f59e0b" }}>掠れ {h.hoarseness}</span>
                  </div>
                </div>
              ))}
              <button onClick={exportHistory} style={{ padding: 10, borderRadius: 8, border: "none", backgroundColor: "#334155", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>JSONエクスポート</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main Training View ──
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", backgroundColor: "#1e293b", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>発声トレーニング</h1>
          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{dayName}曜日 ・ 約10分 ・ 受診前暫定版</p>
        </div>
        <button onClick={() => setShowHistory(true)} style={{ ...S.btn(false), padding: "6px 12px" }}>📊 履歴</button>
      </div>

      {/* Step Progress */}
      <div style={{ display: "flex", padding: "10px 12px", gap: 2, overflowX: "auto", backgroundColor: "#0f172a" }}>
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setCurrentStep(i); timer.reset(s.duration); metro.stop(); }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              backgroundColor: i === currentStep ? "#3b82f6" : i < currentStep ? "#22c55e" : "#1e293b", color: "#fff",
            }}>
              {i < currentStep ? "✓" : s.icon}
            </div>
            <span style={{ fontSize: 9, color: i === currentStep ? "#e2e8f0" : "#475569", textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.title.split(". ")[1] || s.title}
            </span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#f1f5f9" }}>
          {step.icon} {step.title}
        </h2>

        {currentStep === 0 && <StepPrep timer={timer} />}
        {currentStep === 1 && <StepRec1 timer={timer} rec={rec1} />}
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
        {currentStep === 6 && <StepRec2 timer={timer} rec={rec2} evaluation={evaluation} setEvaluation={setEvaluation} history={history} />}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: currentStep === 0 ? "default" : "pointer", backgroundColor: currentStep === 0 ? "#1e293b" : "#334155", color: currentStep === 0 ? "#475569" : "#e2e8f0" }}
          >
            ← 前へ
          </button>
          <button
            onClick={goNext}
            style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", backgroundColor: "#3b82f6", color: "#fff" }}
          >
            {currentStep === STEPS.length - 1 ? "✓ セッション完了" : "次へ →"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: 16 }}>
        <span style={{ color: "#1e293b", fontSize: 12 }}>楽に、前に、はっきり。</span>
      </div>
    </div>
  );
}
