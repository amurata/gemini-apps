import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Mic, Square, PlayCircle,
  Settings2, Activity, Volume2, Info, CheckCircle2
} from 'lucide-react';

// --- Data Definitions ---
const Q1_THEMES = [
  {
    type: "導入",
    text: "本日はお時間をいただきありがとうございます。これから、Expert AX - Level1（Claude Code）を全4回、2ヶ月ほどに渡ってお付き合いいただきます。第1回のテーマは『Claude Code活用の基礎』と題して進めて参りたいと思います。まず、この研修のゴールをお伝えします。Claude Codeというツールを軸にして、AIエージェントを使いこなす技術と知識を獲得してもらうこと、これがこの研修のゴールです。"
  },
  {
    type: "自己紹介",
    text: "内容に入る前に、30秒だけ自己紹介させてください。村田と申します。元々システムエンジニアで、最近はAI導入支援、AIを使った開発支援に従事しています。趣味は登山・トレイルラン。健康管理や運動計画にもAIを活用しています。"
  },
  {
    type: "問いかけ",
    text: "では皆さん、ここまででわからないところはありましたか？ちょっとでも引っかかってるならなんでも聞いて下さいね。私は最初Claudeってなんて読むのかわかりませんでしたよ（笑）。そういう小さなことでも良いんです。ありますか？ないですかね？では先に進みますね。あとで疑問が沸いたらその時に質問してもらっても全然構いません。"
  }
];

const Q2_TEXTS = [
  {
    author: "スティーブ・ジョブズ",
    text: "あなたの時間は限られている。だから、他人の人生を生きることで、時間を無駄にしてはいけない。最も重要なのは、自分の心と直感に従う勇気を持つことだ。"
  },
  {
    author: "ピーター・ドラッカー",
    text: "未来を予測する最良の方法は、自らそれを創り出すことである。変化を恐れず、新たな道具を手に取り、今日の小さな一歩を踏み出す勇気こそが、明日の成果を決定づける。"
  }
];

const Q3_TEXTS = [
  { label: "A. 冒頭", text: "はい、では後半を始めたいと思います。まず最初のテーマはAIリスクとガバナンスです。" },
  { label: "B. 重要説明", text: "このように良く知られたリスクの中で、2026年、もっとも警戒すべきリスクとされているのが「AIへの過剰な権限委譲」です。" },
  { label: "C. 結論", text: "これまでのチャットインターフェースのように、プロンプトでコントロールしようとするのは意味がありません。これがClaude Codeの強いところで、こういったリスクへの最も効果的な対策は「構造で守る」ことです。" }
];

const CONSONANTS_DATA = [
  { line: "カ行", words: "課題、確率", sentence: "課題の解決確率を上げます" },
  { line: "サ行", words: "生成、戦略", sentence: "生成AIを戦略に組み込みます" },
  { line: "タ行", words: "提案、定義", sentence: "要件を定義し、提案します" },
  { line: "ハ行", words: "費用、変化", sentence: "費用の変化を比較します" },
  { line: "ラ行", words: "利益、理解", sentence: "利益の構造を理解します" }
];

// --- Menu Configuration ---
const MENU_STEPS = [
  { id: 'prep', title: "0. 事前準備", duration: 15, type: 'info' },
  { id: 'record1', title: "1. 最初の録音", duration: 40, type: 'record' },
  { id: 'warmup', title: "2. 発声ウォームアップ", duration: 90, type: 'practice' },
  { id: 'clearspeech', title: "3. 教養テキスト音読", duration: 180, type: 'practice' },
  { id: 'script', title: "4. 研修台本ブロック", duration: 180, type: 'practice' },
  { id: 'drill', title: "5. 子音ドリル", duration: 90, type: 'practice' },
  { id: 'record2', title: "6. 最後の録音", duration: 50, type: 'record' },
  { id: 'done', title: "完了", duration: 0, type: 'done' }
];

// --- Custom Hooks ---
// Web Audio API を使用した正確なメトロノーム
function useMetronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(60);
  const audioCtxRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef(null);
  const lookahead = 25.0; // ms
  const scheduleAheadTime = 0.1; // s

  const playClick = (time) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
  };

  const scheduler = useCallback(() => {
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      playClick(nextNoteTimeRef.current);
      nextNoteTimeRef.current += 60.0 / bpm;
    }
    timerIDRef.current = setTimeout(scheduler, lookahead);
  }, [bpm]);

  useEffect(() => {
    if (isPlaying) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
      scheduler();
    } else {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    }
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    };
  }, [isPlaying, scheduler]);

  const toggle = () => setIsPlaying(prev => !prev);
  return { isPlaying, bpm, setBpm, toggle };
}

// MediaRecorder API を使用した録音機能
function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop()); // マイク解放
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("マイクへのアクセスが許可されていないか、利用できません。");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  };

  return { isRecording, startRecording, stopRecording, audioUrl, clearAudio };
}

// --- Main App Component ---
export default function App() {
  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MENU_STEPS[0].duration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showMetronome, setShowMetronome] = useState(false);

  // Custom Hooks
  const metronome = useMetronome();
  const recorder1 = useAudioRecorder();
  const recorder2 = useAudioRecorder();

  // Daily Content Selection Logic
  const dailyData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);

    let drillIndices = [];
    if (dayOfWeek === 1) drillIndices = [0, 1]; // 月: カ・サ
    else if (dayOfWeek === 2) drillIndices = [2, 4]; // 火: タ・ラ
    else if (dayOfWeek === 3) drillIndices = [0, 3]; // 水: カ・ハ
    else if (dayOfWeek === 4) drillIndices = [1, 4]; // 木: サ・ラ
    else if (dayOfWeek === 5) drillIndices = [2, 3]; // 金: タ・ハ
    else if (dayOfWeek === 6) drillIndices = [dayOfYear % 5, (dayOfYear + 1) % 5]; // 土: 日替わりランダム2種
    else drillIndices = []; // 日: 休み

    return {
      theme: Q1_THEMES[dayOfYear % Q1_THEMES.length],
      clearSpeech: Q2_TEXTS[dayOfYear % Q2_TEXTS.length],
      drills: drillIndices.map(i => CONSONANTS_DATA[i]),
      isRestDay: dayOfWeek === 0
    };
  }, []);

  const currentStep = MENU_STEPS[currentStepIndex];

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      handleNext(true); // 自動進行時は running 状態を維持
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Navigation Handlers
  const handleNext = useCallback((isAuto = false) => {
    if (currentStepIndex < MENU_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setTimeLeft(MENU_STEPS[nextIdx].duration);
      if (!isAuto) setIsTimerRunning(false); // 手動操作時はマニュアルモードへ
    } else {
      setIsTimerRunning(false);
    }
  }, [currentStepIndex]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      setTimeLeft(MENU_STEPS[prevIdx].duration);
      setIsTimerRunning(false); // 戻った時は必ずマニュアルモード
    }
  }, [currentStepIndex]);

  // Helper formatting
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Renderers for each step type ---
  const renderContent = () => {
    switch (currentStep.id) {
      case 'prep':
        return (
          <div className="space-y-6 text-center animate-in fade-in duration-500">
            <Info className="w-12 h-12 mx-auto text-blue-500" />
            <div className="text-xl font-medium text-gray-800 dark:text-gray-200">
              <p className="mb-4">のど払いしたくなったら、まず水をひと口。</p>
              <p className="mb-4">姿勢を正し、胸を張りすぎず、首を前に出さない。</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-6">
                目標声量: 「会議室の1対1」
              </p>
            </div>
          </div>
        );

      case 'record1':
      case 'record2':
        const isFirst = currentStep.id === 'record1';
        const recParams = isFirst ? recorder1 : recorder2;
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-blue-800 dark:text-blue-300">本日のテーマ: {dailyData.theme.type}</span>
              </div>
              <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                {dailyData.theme.text}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              {!recParams.isRecording ? (
                <button
                  onClick={recParams.startRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold transition-all shadow-md"
                >
                  <Mic className="w-5 h-5" /> 録音開始
                </button>
              ) : (
                <button
                  onClick={recParams.stopRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-full font-bold transition-all shadow-md animate-pulse"
                >
                  <Square className="w-5 h-5" /> 録音停止
                </button>
              )}

              {recParams.audioUrl && (
                <div className="w-full max-w-md mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">録音データ ({isFirst ? '開始時' : '終了時'}):</p>
                  <audio src={recParams.audioUrl} controls className="w-full" />
                </div>
              )}
            </div>

            {!isFirst && (
               <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                 <h4 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">振り返りチェック（5点満点）</h4>
                 <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-1">
                   <li>語尾が残っているか？</li>
                   <li>こもりが少し減ったか？</li>
                   <li>子音が前より立っているか？</li>
                 </ul>
               </div>
            )}
          </div>
        );

      case 'warmup':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 border-b pb-2">大声禁止・声を前に集める</h3>
            <ol className="space-y-6 text-lg text-gray-700 dark:text-gray-300">
              <li className="flex gap-4">
                <span className="font-bold text-blue-500 min-w-[2rem]">1.</span>
                <div>
                  <span className="font-bold block mb-1">無声の息 3回</span>
                  <span className="text-base text-gray-500">鼻から吸って、口から静かに吐く（1回3秒）</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-bold text-blue-500 min-w-[2rem]">2.</span>
                <div>
                  <span className="font-bold block mb-1">「んー」 5回</span>
                  <span className="text-base text-gray-500">2秒ずつ。口は軽く閉じ、唇か前歯の裏が振動する感覚</span>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-bold text-blue-500 min-w-[2rem]">3.</span>
                <div>
                  <span className="font-bold block mb-1">「んーま」「んーみ」「んーむ」 各2回</span>
                  <span className="text-base text-gray-500">“ん” の楽さを保ったまま後ろの音を足す</span>
                </div>
              </li>
            </ol>
          </div>
        );

      case 'clearspeech':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex gap-2 mb-4 bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
               <div className="flex-1">
                 <h4 className="font-bold text-indigo-800 dark:text-indigo-300">読み方（各1回ずつ）</h4>
                 <ol className="list-decimal list-inside text-sm text-indigo-700 dark:text-indigo-400 mt-1">
                   <li>普通に読む</li>
                   <li><strong className="text-red-500 dark:text-red-400">オーバーに口を使って</strong>読む</li>
                   <li>意味を伝えるつもりで会話寄りに</li>
                 </ol>
               </div>
               <div className="flex-1">
                 <h4 className="font-bold text-indigo-800 dark:text-indigo-300">意識するポイント</h4>
                 <ul className="list-disc list-inside text-sm text-indigo-700 dark:text-indigo-400 mt-1">
                   <li>母音を潰さない / 語尾を消さない</li>
                   <li>子音を先に当ててから母音に抜く</li>
                 </ul>
               </div>
             </div>
             <div className="p-8 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
               <p className="text-2xl leading-loose font-medium text-gray-800 dark:text-gray-100 mb-6">
                 {dailyData.clearSpeech.text}
               </p>
               <p className="text-right text-gray-500 italic">
                 — {dailyData.clearSpeech.author}
               </p>
             </div>
          </div>
        );

      case 'script':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <p className="text-gray-600 dark:text-gray-400 font-medium">
               各フレーズを3回ずつ（普通 → オーバー → 本番調）読みます。<br/>
               <span className="text-sm">※意味の塊（/）を意識して区切ってください。</span>
             </p>
             <div className="space-y-4">
               {Q3_TEXTS.map((item, idx) => (
                 <div key={idx} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                   <div className="text-sm font-bold text-blue-500 mb-2">{item.label}</div>
                   <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
                     {item.text}
                   </p>
                 </div>
               ))}
             </div>
          </div>
        );

      case 'drill':
        if (dailyData.isRestDay) {
          return (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">日曜日は休養日です</h3>
              <p className="text-gray-600 dark:text-gray-400">子音ドリルはお休みです。のどを休ませましょう。<br/>（※最後の録音だけは行います）</p>
            </div>
          );
        }
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <p className="text-gray-600 dark:text-gray-400 font-medium">
               音だけで終わらず、必ず単語→短文までつなげます。速くせず、位置をはっきり取ることを意識してください。
             </p>
             {dailyData.drills.map((drill, idx) => (
               <div key={idx} className="bg-white dark:bg-gray-800 p-6 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
                 <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{drill.line}の練習</h4>
                 <div className="space-y-3">
                   <div className="flex items-center gap-4">
                     <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 px-3 py-1 rounded text-sm w-16 text-center">基本</span>
                     <span className="text-xl tracking-[0.5em] font-medium">{drill.line === 'カ行' ? 'かきくけこ' : drill.line === 'サ行' ? 'さしすせそ' : drill.line === 'タ行' ? 'たちつてと' : drill.line === 'ハ行' ? 'はひふへほ' : 'らりるれろ'}</span>
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 px-3 py-1 rounded text-sm w-16 text-center">単語</span>
                     <span className="text-lg font-medium">{drill.words}</span>
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 px-3 py-1 rounded text-sm w-16 text-center">短文</span>
                     <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{drill.sentence}</span>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        );

      case 'done':
        return (
          <div className="text-center py-12 animate-in fade-in duration-500">
             <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
             <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">本日のトレーニング完了！</h2>
             <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">お疲れ様でした。録音データを比較して成長を確認しましょう。</p>

             <div className="flex justify-center gap-8 text-left max-w-lg mx-auto bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
               <div>
                 <p className="text-sm text-gray-500 mb-2">開始時の録音</p>
                 {recorder1.audioUrl ? <audio src={recorder1.audioUrl} controls className="w-48" /> : <span className="text-gray-400">録音なし</span>}
               </div>
               <div>
                 <p className="text-sm text-gray-500 mb-2">終了時の録音</p>
                 {recorder2.audioUrl ? <audio src={recorder2.audioUrl} controls className="w-48" /> : <span className="text-gray-400">録音なし</span>}
               </div>
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header & Progress */}
        <header className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Volume2 className="w-6 h-6 text-blue-500" />
              発声・滑舌基礎トレーニング
            </h1>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Day {new Date().getDate()}</p>
              <div className="flex items-center gap-2 text-2xl font-mono font-bold text-gray-800 dark:text-gray-200">
                {currentStep.duration > 0 ? formatTime(timeLeft) : '--:--'}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${((currentStepIndex) / (MENU_STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 text-center">
            {currentStep.title}
          </p>
        </header>

        {/* Main Content Area */}
        <main className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 md:p-10 min-h-[400px]">
          {renderContent()}
        </main>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4">

          <div className="flex items-center gap-4">
            <button
              onClick={handlePrev} disabled={currentStepIndex === 0}
              className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              disabled={currentStep.id === 'done'}
              className={`flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                isTimerRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:hover:scale-100`}
            >
              {isTimerRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>

            <button
              onClick={() => handleNext(false)} disabled={currentStepIndex === MENU_STEPS.length - 1}
              className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3 border-l pl-4 dark:border-gray-700">
            <button
              onClick={() => setShowMetronome(!showMetronome)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${showMetronome ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="メトロノーム設定"
            >
              <Settings2 className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">メトロノーム</span>
            </button>
          </div>
        </div>

        {/* Metronome Panel */}
        {showMetronome && (
          <div className="bg-gray-800 text-white rounded-2xl p-6 shadow-lg animate-in slide-in-from-bottom-4 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-bold flex items-center gap-2"><PlayCircle className="w-5 h-5"/> ペースメーカー</h4>
              <p className="text-sm text-gray-400 mt-1">子音が崩れる時や、専門用語が連続する際の補助として使用します。</p>
            </div>

            <div className="flex items-center gap-4 bg-gray-900 p-3 rounded-xl w-full sm:w-auto">
              <button
                onClick={metronome.toggle}
                className={`p-3 rounded-full ${metronome.isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} transition-colors`}
              >
                {metronome.isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="flex flex-col flex-1 min-w-[150px]">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">BPM</span>
                  <span className="text-sm font-mono bg-black px-2 py-0.5 rounded">{metronome.bpm}</span>
                </div>
                <input
                  type="range" min="40" max="80" step="1"
                  value={metronome.bpm}
                  onChange={(e) => metronome.setBpm(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
