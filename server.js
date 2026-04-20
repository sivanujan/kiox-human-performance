const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Set production as the default for hosting environments
const dev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging';
const hostname = 'localhost'; // For cPanel, localhost is usually required

// cPanel Setup Node.js App usually passes the port via process.env.PORT
// It can sometimes be a number or a path to a socket.
const port = process.env.PORT || 3000;

// Initialize the Next.js application
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log(`> Starting KIO-X Portal in ${dev ? 'development' : 'production'} mode...`);

app.prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    })
    .listen(port, (err) => {
      if (err) {
        console.error('> Failed to start server:', err);
        process.exit(1);
      }
      console.log(`> Ready on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('> Next.js preparation failed:', err);
    process.exit(1);
  });

