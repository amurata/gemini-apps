import { ChevronLeft, ChevronRight, Columns, File, FolderOpen, Info, Pause, Play, Settings, Square, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// PDF.js の worker をローカルバンドル（オフラインPWAでもCDN不要）
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

type MediaType = 'image' | 'video' | 'pdf';

interface MediaItem {
  name: string;
  path: string;
  type: MediaType;
  url?: string; // image / video 用の一時URL
  pdfDoc?: PDFDocumentProxy; // pdf 用のドキュメント参照
  pageNumber?: number; // pdf 用のページ番号（1始まり）
}

// レンダリング中タスクの最小インターフェイス（型import不要で扱う）
type RenderTaskLike = { promise: Promise<void>; cancel: () => void };

// PDFページをオンデマンドで canvas に高解像度描画するコンポーネント
const PdfPage = ({ doc, pageNumber }: { doc: PDFDocumentProxy; pageNumber: number }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let disposed = false;
    let task: RenderTaskLike | null = null;
    let timer: number | undefined;
    let lastW = 0;
    let lastH = 0;

    const draw = async () => {
      if (disposed) return;
      const cw = wrap.clientWidth;
      const ch = wrap.clientHeight;
      lastW = cw;
      lastH = ch;
      if (!cw || !ch) return;

      // 進行中の描画があればキャンセル（同一canvasの多重renderを防止）
      if (task) {
        task.cancel();
        task = null;
      }

      const page = await doc.getPage(pageNumber);
      if (disposed) return;

      const base = page.getViewport({ scale: 1 });
      const dpr = window.devicePixelRatio || 1;
      // コンテナに収まる最大倍率 × devicePixelRatio で高精細に
      const fit = Math.min(cw / base.width, ch / base.height);
      const viewport = page.getViewport({ scale: fit * dpr });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      task = page.render({ canvas, viewport });
      try {
        await task.promise;
      } catch {
        // cancel による中断は無視
      }
    };

    // リサイズは debounce して最新サイズで再描画
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(draw, 80);
    };

    draw(); // 初回描画

    const ro = new ResizeObserver(() => {
      const cw = wrap.clientWidth;
      const ch = wrap.clientHeight;
      if (cw === lastW && ch === lastH) return; // サイズ不変なら無視
      schedule();
    });
    ro.observe(wrap);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      task?.cancel();
      ro.disconnect();
    };
  }, [doc, pageNumber]);

  return (
    <div ref={wrapRef} className="w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} className="shadow-2xl rounded-sm" />
    </div>
  );
};

const App = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [columns, setColumns] = useState(1);
  const [isRTL, setIsRTL] = useState(false); // Right-to-Left (日本のマンガ等の見開き用)
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // スライドショー再生中
  const [intervalSec, setIntervalSec] = useState(3); // スライド間隔（秒）
  const [isMuted, setIsMuted] = useState(false); // 動画のミュート状態
  const folderInputRef = useRef<HTMLInputElement>(null); // フォルダ選択用
  const fileInputRef = useRef<HTMLInputElement>(null); // ファイル個別選択用

  // 現在ページに含まれる動画の再生完了を集計するための参照
  const videoEndedRef = useRef(0);
  const pageVideoCountRef = useRef(0);

  // ファイル読み込み処理（PDFはページ単位に展開）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // 画像・動画・PDFのサポート拡張子
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov', 'pdf'];
    const videoExtensions = ['mp4', 'webm', 'mov'];

    const picked = files
      .filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        return validExtensions.includes(ext);
      })
      // 自然順ソート（1.jpg, 2.jpg, 10.jpg が正しく並ぶように）
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    // 前のセッションのリソースを解放（メモリリーク対策）
    mediaList.forEach(m => {
      if (m.url) URL.revokeObjectURL(m.url);
    });
    const oldDocs = new Set(mediaList.map(m => m.pdfDoc).filter(Boolean) as PDFDocumentProxy[]);
    oldDocs.forEach(d => { void d.loadingTask.destroy(); });

    setIsPlaying(false);
    setIsLoading(true);
    try {
      const items: MediaItem[] = [];
      for (const file of picked) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

        if (ext === 'pdf') {
          const data = await file.arrayBuffer();
          const doc = await pdfjsLib.getDocument({ data }).promise;
          for (let p = 1; p <= doc.numPages; p++) {
            items.push({
              name: doc.numPages > 1 ? `${file.name} (p.${p}/${doc.numPages})` : file.name,
              path,
              type: 'pdf',
              pdfDoc: doc,
              pageNumber: p,
            });
          }
        } else {
          items.push({
            name: file.name,
            path,
            type: file.type.startsWith('video/') || videoExtensions.includes(ext) ? 'video' : 'image',
            url: URL.createObjectURL(file), // 表示用の一時URLを生成
          });
        }
      }

      setMediaList(items);
      setCurrentIndex(0);
    } catch (err) {
      console.error('メディアの読み込みに失敗しました', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 現在ページのアイテム（1列=1枚 / 2列=2枚）
  const pageItems = columns === 2
    ? [mediaList[currentIndex], mediaList[currentIndex + 1]]
    : [mediaList[currentIndex]];

  // 手動ページ送り（末尾では停止）
  const goNext = useCallback(() => {
    setCurrentIndex(prev => {
      const nextIndex = prev + columns;
      return nextIndex < mediaList.length ? nextIndex : prev;
    });
  }, [columns, mediaList.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => {
      const prevIndex = prev - columns;
      return prevIndex >= 0 ? prevIndex : 0;
    });
  }, [columns]);

  // スライドショーの前進（末尾では先頭へループ）
  const advance = useCallback(() => {
    setCurrentIndex(prev => {
      const nextIndex = prev + columns;
      return nextIndex < mediaList.length ? nextIndex : 0;
    });
  }, [columns, mediaList.length]);

  // ページが変わるたびに動画完了カウンタをリセット
  useEffect(() => {
    const items = columns === 2
      ? [mediaList[currentIndex], mediaList[currentIndex + 1]]
      : [mediaList[currentIndex]];
    pageVideoCountRef.current = items.filter(m => m?.type === 'video').length;
    videoEndedRef.current = 0;
  }, [currentIndex, columns, mediaList]);

  // 動画の再生終了ハンドラ（スライドショー中のみ、全動画完了で次へ）
  const handleVideoEnded = useCallback(() => {
    if (!isPlaying) return;
    videoEndedRef.current += 1;
    if (videoEndedRef.current >= pageVideoCountRef.current) {
      advance();
    }
  }, [isPlaying, advance]);

  // スライドショー: 静止画（画像/PDF）のみのページは秒数タイマーで送る。
  // 動画を含むページは再生終了（handleVideoEnded）を待つ。
  useEffect(() => {
    if (!isPlaying || mediaList.length === 0) return;
    const items = columns === 2
      ? [mediaList[currentIndex], mediaList[currentIndex + 1]]
      : [mediaList[currentIndex]];
    const hasVideo = items.some(m => m?.type === 'video');
    if (hasVideo) return; // 動画の再生終了待ち

    const t = window.setTimeout(advance, Math.max(0.5, intervalSec) * 1000);
    return () => window.clearTimeout(t);
  }, [isPlaying, currentIndex, columns, mediaList, intervalSec, advance]);

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift でスライドショーをトグル（押しっぱなしのリピートは無視）
      if (e.ctrlKey && e.shiftKey && (e.key === 'Control' || e.key === 'Shift') && !e.repeat) {
        e.preventDefault();
        if (mediaList.length > 0) setIsPlaying(p => !p);
        return;
      }

      // 意図しない発火を防ぐため、入力・ボタン・動画にフォーカス時はそれぞれの操作を優先
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' ||
          target.tagName === 'SELECT' || target.tagName === 'VIDEO') return;

      const isNext = e.key === 'ArrowRight' || e.key === 'ArrowDown' ||
                     (e.key === 'Enter' && !e.shiftKey) ||
                     (e.key === ' ' && !e.shiftKey);

      const isPrev = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ||
                     (e.key === 'Enter' && e.shiftKey) ||
                     (e.key === ' ' && e.shiftKey);

      if (isNext) {
        e.preventDefault();
        goNext();
      } else if (isPrev) {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, mediaList.length]);

  // メディア描画
  const renderMedia = (media: MediaItem | undefined) => {
    if (!media) return null;
    if (media.type === 'pdf' && media.pdfDoc && media.pageNumber) {
      return <PdfPage key={`${media.path}-${media.pageNumber}`} doc={media.pdfDoc} pageNumber={media.pageNumber} />;
    }
    if (media.type === 'video') {
      return (
        <video
          key={media.url}
          src={media.url}
          controls
          autoPlay
          loop={!isPlaying} // スライドショー中はループ無効（endedを検知して次へ）
          muted={isPlaying || isMuted} // スライドショー中は自動ミュート。通常時は音トグルに従う
          onEnded={handleVideoEnded}
          onError={handleVideoEnded} // 再生不可の動画でスライドショーが止まらないよう次へ送る
          className="w-full h-full object-contain shadow-2xl rounded-sm"
        />
      );
    }
    return (
      <img
        key={media.url}
        src={media.url}
        alt={media.name}
        className="w-full h-full object-contain shadow-2xl rounded-sm"
      />
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-900 text-neutral-200 font-sans overflow-hidden">
      {/* 隠しファイルインプット (ディレクトリ選択用) */}
      <input
        type="file"
        webkitdirectory="true"
        directory="true"
        multiple
        ref={folderInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      {/* 隠しファイルインプット (ファイル個別選択用: PDF等をジャスト指定) */}
      <input
        type="file"
        accept=".pdf,image/*,video/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ヘッダー・コントロールバー */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 border-b border-neutral-700 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors text-sm font-medium"
          >
            <FolderOpen size={16} />
            フォルダを開く
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors text-sm font-medium"
            title="PDF・画像・動画をファイル単位で選択"
          >
            <File size={16} />
            ファイルを開く
          </button>

          {mediaList.length > 0 && (
            <div className="text-sm text-neutral-400">
              <span className="text-neutral-100">{currentIndex + 1}</span>
              {columns === 2 && currentIndex + 1 < mediaList.length && ` - ${currentIndex + 2}`}
              {' / '}{mediaList.length}
              <span className="ml-4 truncate max-w-[240px] inline-block align-bottom">
                {mediaList[currentIndex]?.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* スライドショー コントロール */}
          <div className="flex items-center gap-1 bg-neutral-700 rounded-md p-0.5 pr-2">
            <button
              onClick={() => setIsPlaying(p => !p)}
              disabled={mediaList.length === 0}
              className={`p-1.5 rounded-sm transition-colors ${isPlaying ? 'bg-green-600 text-white' : 'text-neutral-300 hover:text-white'} disabled:opacity-40 disabled:cursor-not-allowed`}
              title={isPlaying ? 'スライドショー停止' : 'スライドショー再生'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <input
              type="number"
              min={0.5}
              max={120}
              step={0.5}
              value={intervalSec}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) setIntervalSec(Math.min(120, Math.max(0.5, v)));
              }}
              className="w-14 bg-neutral-900 border border-neutral-600 text-sm rounded px-1.5 py-0.5 outline-none focus:border-blue-500 text-right"
              title="スライド間隔（秒）"
            />
            <span className="text-xs text-neutral-400">秒</span>
          </div>

          {/* 動画の音声トグル */}
          <button
            onClick={() => setIsMuted(m => !m)}
            className={`p-1.5 rounded-md transition-colors bg-neutral-700 ${isMuted ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-200 hover:text-white'}`}
            title={isMuted ? '動画: ミュート中（クリックで音声ON）' : '動画: 音声ON（クリックでミュート）'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* 表示列切り替え */}
          <div className="flex bg-neutral-700 rounded-md p-0.5">
            <button
              onClick={() => setColumns(1)}
              className={`p-1.5 rounded-sm transition-colors ${columns === 1 ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
              title="1列表示"
            >
              <Square size={16} />
            </button>
            <button
              onClick={() => {
                setColumns(2);
                // 1列目で奇数番目(indexは偶数)になるように調整
                if (currentIndex % 2 !== 0) setCurrentIndex(prev => prev - 1);
              }}
              className={`p-1.5 rounded-sm transition-colors ${columns === 2 ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
              title="2列表示（見開き）"
            >
              <Columns size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-md transition-colors ml-2 ${showSettings ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'}`}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* 設定パネル */}
      {showSettings && (
        <div className="absolute top-14 right-4 bg-neutral-800 border border-neutral-700 rounded-md shadow-xl p-4 z-20 w-64">
          <h3 className="text-sm font-semibold mb-3 text-neutral-100 border-b border-neutral-700 pb-2">設定</h3>

          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-neutral-300">2列表示の並び順</label>
            <select
              value={isRTL ? 'rtl' : 'ltr'}
              onChange={(e) => setIsRTL(e.target.value === 'rtl')}
              className="bg-neutral-900 border border-neutral-700 text-sm rounded px-2 py-1 outline-none focus:border-blue-500"
            >
              <option value="ltr">左 → 右</option>
              <option value="rtl">右 → 左 (マンガ用)</option>
            </select>
          </div>

          <div className="mt-4 text-xs text-neutral-500 flex items-start gap-1">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>
              操作: Enter/Space/矢印キーで次へ。Shift併用で前へ。<br />
              スライドショー: ▶または Ctrl+Shift でON/OFF。秒数ごとに自動送り、動画は再生終了まで待機、末尾で先頭へループ。<br />
              動画クリックで再生/シーク操作。音声はスピーカーアイコンで切替。<br />
              「フォルダを開く」でまとめて、「ファイルを開く」でPDF等を個別指定。
            </p>
          </div>
        </div>
      )}

      {/* メイン表示領域 */}
      <div className="flex-1 relative overflow-hidden bg-neutral-950">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
            <div className="w-8 h-8 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p>読み込み中...</p>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
            <FolderOpen size={48} className="mb-4 opacity-50" />
            <p>左上のボタンから画像・動画・PDFが入ったフォルダを選択してください</p>
          </div>
        ) : (
          <div className="w-full h-full p-4 flex items-center justify-between group">

            {/* 左クリックスペース（戻る） */}
            <div
              onClick={goPrev}
              className="absolute left-0 top-0 bottom-0 w-1/6 z-10 cursor-pointer flex items-center justify-start pl-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="bg-black/50 p-2 rounded-full text-white hover:bg-black/80">
                <ChevronLeft size={32} />
              </div>
            </div>

            {/* メディアコンテナ */}
            <div className={`flex w-full h-full gap-4 ${isRTL && columns === 2 ? 'flex-row-reverse' : 'flex-row'} justify-center items-center`}>
              <div className={`flex-1 flex justify-center items-center h-full ${columns === 1 ? 'w-full' : 'w-1/2'}`}>
                {renderMedia(pageItems[0])}
              </div>

              {columns === 2 && (
                <div className="flex-1 flex justify-center items-center h-full w-1/2">
                  {currentIndex + 1 < mediaList.length && renderMedia(pageItems[1])}
                </div>
              )}
            </div>

            {/* 右クリックスペース（進む） */}
            <div
              onClick={goNext}
              className="absolute right-0 top-0 bottom-0 w-1/6 z-10 cursor-pointer flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="bg-black/50 p-2 rounded-full text-white hover:bg-black/80">
                <ChevronRight size={32} />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default App;
