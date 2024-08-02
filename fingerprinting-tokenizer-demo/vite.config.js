const defineConfig = {
  optimizeDeps: {
    include: ['pcp-client-javascript-sdk'],
  },
  build: {
    commonjsOptions: {
      include: [/pcp-client-javascript-sdk/, /node_modules/],
    },
  },
};

export default defineConfig;
