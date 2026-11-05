const defineConfig = {
  optimizeDeps: {
    include: [],
  },
  build: {
    rollupOptions: { input: { main: 'index.html', express: 'express.html' } },
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
};

export default defineConfig;
