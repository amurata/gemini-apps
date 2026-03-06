/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// webkitdirectory / directory 属性の型拡張
declare namespace React {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
