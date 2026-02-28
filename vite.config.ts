import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // এই লাইনটি সাদা স্ক্রিন দূর করার জন্য সবচেয়ে জরুরি
    // এটি সব পাথকে / এর বদলে ./ (Relative Path) এ রুপান্তর করবে
    base: './', 
    
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      host: true
    },
    define: {
      'process.env': env
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // ইলেকট্রনে অনেক সময় খালি স্ক্রিন এড়াতে এটি সাহায্য করে
      emptyOutDir: true 
    }
  };
});