import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Proxy OpenAI API calls - forwards request and injects API key server-side
app.post('/api/openai/*', async (req, res) => {
  const apiPath = req.originalUrl.replace('/api/openai', '');
  try {
    const response = await fetch(`https://api.openai.com${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
