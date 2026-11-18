// npm run test:api:mock  ->  starts the local simulation and runs the API tests against it
const { spawn } = require('child_process');
const { createServer, VALID_KEY } = require('./mock-books-server');

const PORT = Number(process.env.MOCK_PORT || 4010);
const server = createServer().listen(PORT, '127.0.0.1', () => {
  console.log(`Mock Google Books API listening on http://127.0.0.1:${PORT}/books/v1/ (simulation, not the real API)`);
  const child = spawn('npx', ['playwright', 'test', '--project=google-books-api', ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      BOOKS_BASE_URL: `http://127.0.0.1:${PORT}/books/v1/`,
      GOOGLE_BOOKS_API_KEY: VALID_KEY,
    },
  });
  child.on('exit', (code) => { server.close(); process.exit(code ?? 1); });
});
