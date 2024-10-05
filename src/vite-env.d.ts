/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  interface Window {
    __TAURI__?: typeof import('@tauri-apps/api');
  }
}

declare module 'html2pdf.js'