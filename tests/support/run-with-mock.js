// =====================================================================================================
// tests/support/run-with-mock.js  -  the script behind `npm run test:api:mock`.
// =====================================================================================================
// WHAT IT DOES, IN ORDER: (1) starts the fake Google Books server, (2) runs the API tests pointing at it,
// (3) stops the fake server when the tests finish and passes the result (pass/fail) on.
// =====================================================================================================
const { spawn } = require('child_process');                       // lets Node start another program (here: Playwright)
const { createServer, VALID_KEY } = require('./mock-books-server');

const PORT = Number(process.env.MOCK_PORT || 4010);               // local port number; 4010 unless overridden

// Start listening on this computer only (127.0.0.1 = "localhost"), then run the tests once it is ready.
const server = createServer().listen(PORT, '127.0.0.1', () => {
  console.log(`Mock Google Books API listening on http://127.0.0.1:${PORT}/books/v1/ (simulation, not the real API)`);

  // Same as typing:  npx playwright test --project=google-books-api   (extra options typed after the npm command are appended)
  const child = spawn('npx', ['playwright', 'test', '--project=google-books-api', ...process.argv.slice(2)], {
    stdio: 'inherit',                                              // show the test output in your terminal
    shell: process.platform === 'win32',                           // needed on Windows to find `npx`
    env: {
      ...process.env,                                              // keep the normal environment variables...
      BOOKS_BASE_URL: `http://127.0.0.1:${PORT}/books/v1/`,         // ...but point the tests at the fake server
      GOOGLE_BOOKS_API_KEY: VALID_KEY,                             // ...with the key the fake server accepts
    },
  });
  // When Playwright ends: stop the fake server and exit with the same result code (0 = all passed).
  child.on('exit', (code) => { server.close(); process.exit(code ?? 1); });
});
