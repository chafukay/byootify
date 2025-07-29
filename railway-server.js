import express from 'express';
import path from 'path';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES modules dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Byootify Railway Server...');
console.log('📁 __dirname:', __dirname);
console.log('🔧 PORT:', PORT);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);

// Essential middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving - check multiple possible locations
const staticPaths = [
  path.join(__dirname, 'dist', 'public'),
  path.join(__dirname, 'client', 'dist'),
  path.join(__dirname, 'build'),
  path.join(__dirname, 'public')
];

let staticPath = null;
for (const testPath of staticPaths) {
  try {
    const fs = await import('fs');
    if (fs.existsSync(testPath)) {
      staticPath = testPath;
      console.log('📂 Found static files at:', staticPath);
      break;
    }
  } catch (err) {
    // Continue checking other paths
  }
}

if (staticPath) {
  app.use(express.static(staticPath));
  console.log('✅ Static files configured from:', staticPath);
} else {
  console.log('⚠️ No static files directory found, serving basic responses');
}

// Health check endpoint - this is critical for Railway
app.get('/api/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    platform: 'Railway',
    port: PORT,
    staticPath: staticPath || 'not found',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  };
  
  console.log('🔍 Health check requested:', healthInfo);
  res.json(healthInfo);
});

// Database connection check
app.get('/api/db-status', async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      // Try to connect to database
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      await pool.end();
      
      res.json({ 
        database: 'connected', 
        url: process.env.DATABASE_URL ? 'configured' : 'missing',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({ 
        database: 'no url configured',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      database: 'connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Basic API endpoints for testing
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Byootify API is working',
    timestamp: new Date().toISOString(),
    endpoint: '/api/test'
  });
});

// Catch-all API route
app.get('/api/*', (req, res) => {
  console.log('🔄 API request:', req.path);
  res.json({ 
    message: 'Byootify API endpoint',
    endpoint: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    note: 'Full API will be available after database setup'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  console.log('📄 Serving request:', req.path);
  
  if (staticPath) {
    const indexPath = path.join(staticPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('❌ Error serving index.html:', err);
        res.status(500).send(`
          <html>
            <head><title>Byootify - Loading Issue</title></head>
            <body>
              <h1>Byootify Beauty Services</h1>
              <p>Application is starting up...</p>
              <p>Static path: ${staticPath}</p>
              <p>Error: ${err.message}</p>
              <a href="/api/health">Check Health</a>
            </body>
          </html>
        `);
      }
    });
  } else {
    // Fallback HTML for when static files aren't found
    res.send(`
      <html>
        <head>
          <title>Byootify - Beauty Services Platform</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
            .logo { color: #9333ea; font-size: 2em; font-weight: bold; margin-bottom: 20px; }
            .status { background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            a { color: #9333ea; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">✨ Byootify</div>
            <h1>Beauty Services Platform</h1>
            <p><strong>Staying Beautiful Shouldn't be Stressful</strong></p>
            
            <div class="status">
              <h3>🚀 Application Status: Running</h3>
              <p>Server is active and responding to requests.</p>
              <p><strong>Platform:</strong> Railway</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
              <p><strong>Port:</strong> ${PORT}</p>
            </div>
            
            <h3>🔍 System Checks:</h3>
            <ul>
              <li><a href="/api/health">Health Check</a> - Server status</li>
              <li><a href="/api/db-status">Database Status</a> - Connection test</li>
              <li><a href="/api/test">API Test</a> - Basic endpoint</li>
            </ul>
            
            <p><em>Full React application will load once static files are properly deployed.</em></p>
          </div>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server with better error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Byootify server running on port ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📁 Static files: ${staticPath || 'serving fallback HTML'}`);
  console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`);
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

export default app;