import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize SQLite Database
const db = new Database('decisions.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'tiebreaker-secret',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
  }
}));

// Decision Routes (SQLite)
app.post('/api/decisions/save', (req: Request, res: Response) => {
  try {
    const { filename, content } = req.body;
    const stmt = db.prepare('INSERT INTO decisions (filename, content) VALUES (?, ?)');
    const info = stmt.run(filename, content);
    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    console.error('Database save error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/decisions/list', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT id, filename as name, created_at as createdTime FROM decisions ORDER BY created_at DESC');
    const rows = stmt.all();
    res.json(rows);
  } catch (error: any) {
    console.error('Database list error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/decisions/file/:id', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT content FROM decisions WHERE id = ?');
    const row = stmt.get(req.params.id) as { content: string } | undefined;
    if (row) {
      res.send(row.content);
    } else {
      res.status(404).send('Decision not found');
    }
  } catch (error: any) {
    console.error('Database get error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
