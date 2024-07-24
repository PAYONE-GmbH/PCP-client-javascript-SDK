const defineConfig = {
  optimizeDeps: {
    include: [],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
};

export default defineConfig;
