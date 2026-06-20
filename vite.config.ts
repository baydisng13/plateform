import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import svgr from 'vite-plugin-svgr'

const config = defineConfig(({ mode }) => ({
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  plugins: [
    devtools(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact(),
    svgr(),
    nitro(),
  ],
}))

export default config
