import basicSsl from '@vitejs/plugin-basic-ssl';

const defineConfig = {
  plugins: [basicSsl()],
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
