// <reference types="vite/client" />
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import vitePluginObfuscator from "./plugin/vite-plugin-obfuscator";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(),
    !isSsrBuild && vitePluginObfuscator({
    obfuscatorOptions: {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: false,
      identifierNamesGenerator: 'hexadecimal',
      log: true, // Window.close error when enabled
      numbersToExpressions: true,
      renameGlobals: false,
      selfDefending: true,
      simplify: true,
      splitStrings: false, // plotly.js error when enabled
      stringArray: true,
      stringArrayCallsTransform: false,
      stringArrayEncoding: [],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 1,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 2,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 0.75,
      unicodeEscapeSequence: false
    }
  })

  ],
  // include: ['react-helmet-async'],
  ssr: {
    noExternal: ['posthog-js', '@posthog/react']
  },
  build: {
    sourcemap: false,
    rollupOptions: isSsrBuild
      ? // For server (isSrBuild = true):
      {
        input: './server/app.ts',
      }
      : // For client (isSrBuild = false):
      {
        output: {
          entryFileNames: `assets/[hash].js`,
          chunkFileNames: `assets/[hash].js`,
          assetFileNames: `assets/[hash].[ext]`,
        },
      },
  }, define: {
    // 'global': 'window', // not work for web worker
  }

}));
