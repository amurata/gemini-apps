import { ChevronLeft, ChevronRight, Columns, FolderOpen, Info, Settings, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface MediaItem {
  name: string;
  path: string;
  type: 'image' | 'video';
  url: string;
}

const App = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [columns, setColumns] = useState(1);
  const [isRTL, setIsRTL] = useState(false); // Right-to-Left (日本のマンガ等の見開き用)
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル読み込み処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // 画像と動画のサポート拡張子
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'];

    const filtered: MediaItem[] = files
      .filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        return validExtensions.includes(ext);
      })
      // 自然順ソート（1.jpg, 2.jpg, 10.jpg が正しく並ぶように）
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
      .map(file => ({
        name: file.name,
        path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
        type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
        url: URL.createObjectURL(file), // 表示用の一時URLを生成
      }));

    // 前のセッションのURLオブジェクトを解放（メモリリーク対策）
    mediaList.forEach(m => URL.revokeObjectURL(m.url));

    setMediaList(filtered);
    setCurrentIndex(0);
  };

  // ページ送りロジック
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

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 意図しない発火を防ぐため、修飾キーのみや入力フォーム操作時はスキップ
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') return;

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
  }, [goNext, goPrev]);

  // メディア描画コンポーネント
  const renderMedia = (media: MediaItem | undefined) => {
    if (!media) return null;
    if (media.type === 'video') {
      return (
        <video
          src={media.url}
          controls
          autoPlay
          loop
          muted // 自動再生を確実にするためミュートをデフォルトに
          className="w-full h-full object-contain shadow-2xl rounded-sm"
        />
      );
    }
    return (
      <img
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
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ヘッダー・コントロールバー */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 border-b border-neutral-700 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors text-sm font-medium"
          >
            <FolderOpen size={16} />
            フォルダを開く
          </button>

          {mediaList.length > 0 && (
            <div className="text-sm text-neutral-400">
              <span className="text-neutral-100">{currentIndex + 1}</span>
              {columns === 2 && currentIndex + 1 < mediaList.length && ` - ${currentIndex + 2}`}
              {' / '}{mediaList.length}
              <span className="ml-4 truncate max-w-[200px] inline-block align-bottom">
                {mediaList[currentIndex]?.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
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
              title="2列表示"
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
            <p>操作: Enter/Space/矢印キーで次へ。<br/>Shiftキーを押しながらで前へ。</p>
          </div>
        </div>
      )}

      {/* メイン表示領域 */}
      <div className="flex-1 relative overflow-hidden bg-neutral-950">
        {mediaList.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
            <FolderOpen size={48} className="mb-4 opacity-50" />
            <p>左上のボタンから画像や動画が入ったフォルダを選択してください</p>
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
                {renderMedia(mediaList[currentIndex])}
              </div>

              {columns === 2 && (
                <div className="flex-1 flex justify-center items-center h-full w-1/2">
                  {currentIndex + 1 < mediaList.length && renderMedia(mediaList[currentIndex + 1])}
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
