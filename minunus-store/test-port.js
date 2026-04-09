const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello');
});
server.listen(54321, '127.0.0.1', () => {
  console.log('Listening on 54321');
  process.exit(0);
});
server.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
