import type { PortfolioApp } from '../types/app'

export const apps: PortfolioApp[] = [
  {
    id: 'tabata-hiit-bike',
    title: 'Tabata HIIT Bike',
    summary: 'ローラー台向けのTabataインターバル管理アプリ。ウォームアップからクールダウンまで一気通貫で進行します。',
    tags: ['React', 'Vite', 'PWA', 'HIIT'],
    url: 'https://tabata-hiit-bike.pages.dev',
    status: 'published',
  },
  {
    id: 'media-viewer',
    title: 'Media Viewer',
    summary: 'ローカルフォルダの画像・動画を見開き表示できるビューワー。マンガ用の右→左表示にも対応。',
    tags: ['React', 'Vite', 'PWA', 'Viewer'],
    url: 'https://media-viewer.pages.dev',
    status: 'published',
  },
  {
    id: 'voice-training',
    title: '発声トレーニング',
    summary: '発声・滑舌の基礎トレーニングアプリ。録音比較、コーチノート、メトロノーム、自己評価グラフを搭載。',
    tags: ['React', 'Vite', 'PWA', 'Voice'],
    url: 'https://voice-training.pages.dev',
    status: 'published',
  },
]
