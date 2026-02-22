import { Activity, ChevronRight, Play, RotateCcw, Skull, Timer, X, Zap } from 'lucide-react';
import { type TouchEvent, useEffect, useRef, useState } from 'react';

// 設定定数（改修版）
const WARMUP_DURATION = 300; // 5分に変更
const SPRINT_DURATION = 20;  // 20秒
const REST_DURATION = 10;    // 10秒
const COOLDOWN_DURATION = 300; // 5分
const TOTAL_SETS = 8;

// フェーズ定義
type Phase = 'idle' | 'warmup' | 'tabata_sprint' | 'tabata_rest' | 'cooldown' | 'completed';

const TabataHiitBikeApp = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');

  // スワイプ検知用のRef
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // タイマーロジック
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      switch (phase) {
        case 'warmup':
          setPhase('tabata_sprint');
          setTimeLeft(SPRINT_DURATION);
          setCurrentSet(1);
          break;
        case 'tabata_sprint':
          if (currentSet < TOTAL_SETS) {
            setPhase('tabata_rest');
            setTimeLeft(REST_DURATION);
          } else {
            setPhase('cooldown');
            setTimeLeft(COOLDOWN_DURATION);
          }
          break;
        case 'tabata_rest':
          setCurrentSet((prev) => prev + 1);
          setPhase('tabata_sprint');
          setTimeLeft(SPRINT_DURATION);
          break;
        case 'cooldown':
          setPhase('completed');
          setIsActive(false);
          break;
        default:
          break;
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentSet, isActive, phase, timeLeft]);

  // 励ましメッセージ更新（後半戦用）
  useEffect(() => {
    if (phase === 'tabata_sprint' || phase === 'tabata_rest') {
      if (currentSet === 5) setMotivationalMessage('折り返し！ペース落とすな！');
      else if (currentSet === 6) setMotivationalMessage('ここからが本当の勝負だ！');
      else if (currentSet === 7) setMotivationalMessage('死ぬ気で回せ！あと少し！');
      else if (currentSet === 8) setMotivationalMessage('ラスト20秒！全てを出し切れ！！');
      else setMotivationalMessage('');
    } else {
      setMotivationalMessage('');
    }
  }, [currentSet, phase]);

  // アクション関数
  const startWarmup = () => {
    setPhase('warmup');
    setTimeLeft(WARMUP_DURATION);
    setCurrentSet(1);
    setIsActive(true);
  };

  const startTabata = () => {
    setPhase('tabata_sprint');
    setTimeLeft(SPRINT_DURATION);
    setCurrentSet(1);
    setIsActive(true);
  };

  const resetApp = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeLeft(0);
    setCurrentSet(1);
  };

  // スワイプ処理
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;

    if (isLeftSwipe && phase === 'warmup') {
      startTabata();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // 時間フォーマット (mm:ss)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // UIヘルパー
  const getPhaseLabel = () => {
    switch (phase) {
      case 'warmup': return 'WARM UP';
      case 'tabata_sprint': return 'SPRINT';
      case 'tabata_rest': return 'REST';
      case 'cooldown': return 'COOL DOWN';
      case 'completed': return 'FINISHED';
      default: return '';
    }
  };

  const getPhaseColor = () => {
    if (phase === 'tabata_sprint') return 'text-red-500';
    if (phase === 'tabata_rest') return 'text-orange-400';
    if (phase === 'warmup') return 'text-blue-400';
    if (phase === 'cooldown') return 'text-emerald-400'; // Fixed syntax error here
    return 'text-white';
  };

  return (
    <div
      className="min-h-screen bg-black text-white font-mono flex flex-col relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none z-0">
        <div className={`absolute top-10 right-[-50px] w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000 ${phase === 'tabata_sprint' ? 'bg-red-600' : 'bg-blue-600'}`}></div>
        <div className="absolute bottom-10 left-[-50px] w-64 h-64 bg-zinc-800 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <div className="z-10 pt-14 px-6 pb-4 flex justify-between items-start">
         <div>
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Activity className={`w-4 h-4 ${isActive ? 'animate-pulse text-red-500' : ''}`} />
              <span className="text-[10px] tracking-[0.2em] font-bold">SYSTEM: CARDIAC_LIMIT</span>
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
              VO2<span className="text-red-600">MAX</span> PROTOCOL
            </h1>
         </div>
         {phase !== 'idle' && (
            <button
              onClick={resetApp}
              className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white border border-zinc-800"
            >
              <X size={20} />
            </button>
         )}
      </div>

      {/* Main Content */}
      <div className="flex-1 z-10 px-4 flex flex-col justify-center max-w-md mx-auto w-full">

        {phase === 'idle' && (
          <div className="text-center animate-in fade-in zoom-in duration-500">
             <div className="mb-12 relative inline-block">
                <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 rounded-full"></div>
                <Skull className="w-24 h-24 text-zinc-200 mx-auto relative z-10" />
             </div>
             <p className="text-zinc-400 text-sm tracking-widest mb-2">READY TO SUFFER?</p>
             <p className="text-xs text-zinc-600 mb-8">WARMUP 5min + TABATA 4min + COOLDOWN</p>

             <button
               onClick={startWarmup}
               className="group relative w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-2xl text-xl tracking-widest transition-all active:scale-95 shadow-lg shadow-red-900/30 overflow-hidden"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
               <span className="flex items-center justify-center gap-2">
                 <Play fill="currentColor" /> START
               </span>
             </button>
          </div>
        )}

        {phase === 'completed' && (
          <div className="text-center animate-in zoom-in duration-500">
             <div className="mb-8">
                <Activity className="w-24 h-24 text-emerald-500 mx-auto" />
             </div>
             <h2 className="text-4xl font-bold italic text-white mb-2">MISSION<br/>COMPLETED</h2>
             <p className="text-zinc-400 mt-4">心肺機能限界到達を確認。</p>

             <button
               onClick={resetApp}
               className="mt-12 flex items-center justify-center gap-2 mx-auto text-zinc-400 hover:text-white px-6 py-3 border border-zinc-800 rounded-full"
             >
               <RotateCcw size={16} /> タイトルへ戻る
             </button>
          </div>
        )}

        {/* Running Phases */}
        {(phase !== 'idle' && phase !== 'completed') && (
          <div className="flex flex-col gap-6">

            {/* Status Display */}
            <div className="text-center mb-4">
               <p className={`text-sm font-bold tracking-[0.3em] ${getPhaseColor()} mb-2`}>{getPhaseLabel()}</p>
               <div className="text-7xl font-black tabular-nums tracking-tighter">
                  {formatTime(timeLeft)}
               </div>

               {phase === 'warmup' && (
                 <div className="mt-4 flex items-center justify-center gap-2 text-zinc-500 text-xs animate-pulse">
                    <span>SWIPE TO SKIP</span> <ChevronRight size={12} />
                 </div>
               )}
            </div>

            {/* TABATA UI BLOCKS */}
            {(phase === 'tabata_sprint' || phase === 'tabata_rest') && (
               <>
                {/* Sprint Block */}
                <div className={`relative transition-all duration-300 ${phase === 'tabata_sprint' ? 'scale-105 opacity-100 z-20' : 'scale-95 opacity-40 blur-[1px]'}`}>
                  <div className={`absolute -inset-1 rounded-2xl blur opacity-40 transition-colors duration-300 ${phase === 'tabata_sprint' ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-transparent'}`}></div>
                  <div className={`relative bg-zinc-900 border p-6 rounded-xl flex items-center justify-between ${phase === 'tabata_sprint' ? 'border-red-500/50' : 'border-zinc-800'}`}>
                    <div>
                      <p className="text-zinc-400 text-xs tracking-widest mb-1">全力ペダリング</p>
                      <p className="text-3xl font-bold text-white">20 <span className="text-sm font-normal text-zinc-500">秒</span></p>
                    </div>
                    <div className="text-right">
                       <div className="flex items-center justify-end gap-1 text-orange-400">
                          <Zap size={16} fill="currentColor" />
                          <span className="font-bold text-sm">RPM 100+</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Rest Block */}
                <div className={`relative transition-all duration-300 ${phase === 'tabata_rest' ? 'scale-105 opacity-100 z-20' : 'scale-95 opacity-40 blur-[1px]'}`}>
                   <div className={`absolute -inset-1 rounded-2xl blur opacity-40 transition-colors duration-300 ${phase === 'tabata_rest' ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                   <div className={`relative bg-zinc-900 border p-6 rounded-xl flex items-center justify-between ${phase === 'tabata_rest' ? 'border-emerald-500/50' : 'border-zinc-800'}`}>
                    <div>
                      <p className="text-zinc-400 text-xs tracking-widest mb-1">完全休息</p>
                      <p className="text-3xl font-bold text-white">10 <span className="text-sm font-normal text-zinc-500">秒</span></p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm text-zinc-300">足をゆっくり回す</p>
                    </div>
                  </div>
                </div>
               </>
            )}

             {/* Warmup/Cooldown Progress Bar */}
             {(phase === 'warmup' || phase === 'cooldown') && (
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden mt-4">
                   <div
                     className={`h-full transition-all duration-1000 linear ${phase === 'warmup' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                     style={{ width: `${((phase === 'warmup' ? WARMUP_DURATION : COOLDOWN_DURATION) - timeLeft) / (phase === 'warmup' ? WARMUP_DURATION : COOLDOWN_DURATION) * 100}%` }}
                   ></div>
                </div>
             )}

          </div>
        )}
      </div>

      {/* Footer / Motivational Message */}
      <div className="z-10 pb-8 px-6 min-h-[120px] flex flex-col justify-end">
         {(phase === 'tabata_sprint' || phase === 'tabata_rest') && (
            <div className="text-center">
               <div className="flex items-center justify-center gap-3 mb-2">
                  <Timer className="w-4 h-4 text-red-500" />
                  <span className="text-xl font-bold text-zinc-300 tracking-widest">
                     SET <span className="text-white text-3xl">{currentSet}</span> / {TOTAL_SETS}
                  </span>
               </div>

               {/* Motivational Text */}
               {motivationalMessage && (
                 <div className="mt-2 animate-bounce">
                    <p className="text-red-500 font-bold italic text-lg bg-red-950/30 py-1 px-4 rounded-lg inline-block border border-red-900/50">
                       {motivationalMessage}
                    </p>
                 </div>
               )}

               {/* Progress Dots */}
               <div className="mt-4 flex justify-center gap-1">
                  {[...Array(TOTAL_SETS)].map((_, i) => (
                     <div
                        key={i}
                        className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${i < currentSet ? 'bg-red-600' : 'bg-zinc-800'}`}
                     ></div>
                  ))}
               </div>
            </div>
         )}

         {/* Simple phase description for warmup/cooldown */}
         {(phase === 'warmup') && (
            <p className="text-center text-zinc-500 text-xs">体を温め、心拍数を徐々に上げてください。</p>
         )}
         {(phase === 'cooldown') && (
            <p className="text-center text-zinc-500 text-xs">急に止まらず、ゆっくり足を回して心拍を戻しましょう。</p>
         )}
      </div>
    </div>
  );
};

export default TabataHiitBikeApp;
