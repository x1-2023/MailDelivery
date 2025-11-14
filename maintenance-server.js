const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const HTML_FILE = path.join(__dirname, 'maintenance.html');

const server = http.createServer((req, res) => {
  // Serve maintenance page for all requests
  fs.readFile(HTML_FILE, 'utf8', (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Lỗi hệ thống');
      return;
    }
    
    res.writeHead(503, { 
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '300' // Tell browsers to retry after 5 minutes
    });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🔧 MAINTENANCE MODE ACTIVE');
  console.log('================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`📄 Serving: ${HTML_FILE}`);
  console.log('');
  console.log('⚠️  All visitors will see maintenance page');
  console.log('');
  console.log('To stop: Ctrl+C or kill this process');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down maintenance server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down maintenance server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
