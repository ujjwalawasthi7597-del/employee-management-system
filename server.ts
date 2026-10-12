import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './server/routes/auth';
import userRoutes from './server/routes/users';
import departmentRoutes from './server/routes/departments';
import attendanceRoutes from './server/routes/attendance';
import leaveRoutes from './server/routes/leaves';
import payrollRoutes from './server/routes/payroll';
import projectRoutes from './server/routes/projects';
import performanceRoutes from './server/routes/performance';
import announcementRoutes from './server/routes/announcements';
import auditRoutes from './server/routes/audit';
import analyticsRoutes from './server/routes/analytics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Vite client assets and inline SVG/fonts
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Rate limiting for auth sensitive operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'TalentGrid Enterprise EMS',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api', auditRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.',
  });
});

// Setup Frontend Serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TalentGrid EMS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
