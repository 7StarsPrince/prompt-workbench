const { spawn } = require('child_process');
const axios = require('axios');

const OPENCLAW_BASE_URL = process.env.OPENCLAW_URL || 'http://localhost:8080';

// Check if local OpenClaw gateway is running
async function isAvailable() {
  try {
    await axios.get(`${OPENCLAW_BASE_URL}/health`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// Stream chat via local OpenClaw gateway API
async function chatStream(message, history = [], onChunk) {
  try {
    const response = await axios.post(
      `${OPENCLAW_BASE_URL}/api/v1/chat`,
      { message, history, stream: true },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENCLAW_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 120000
      }
    );

    return new Promise((resolve, reject) => {
      let buffer = '';
      
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line
        
        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              resolve();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content || parsed.delta?.content) {
                onChunk(parsed.content || parsed.delta.content);
              }
            } catch {
              // ignore parse errors for non-JSON lines
            }
          }
        }
      });

      response.data.on('end', () => resolve());
      response.data.on('error', reject);
    });
  } catch (error) {
    // Fallback: try CLI if gateway not available
    return chatViaCLI(message, onChunk);
  }
}

// Fallback: use openclaw CLI
function chatViaCLI(message, onChunk) {
  return new Promise((resolve, reject) => {
    const child = spawn('openclaw', ['ask', message], {
      env: { ...process.env },
      shell: true
    });

    let output = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      onChunk(text);
    });

    child.stderr.on('data', (data) => {
      console.error('OpenClaw stderr:', data.toString());
    });

    child.on('close', (code) => {
      if (code !== 0 && !output) {
        reject(new Error(`OpenClaw exited with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(new Error(`OpenClaw not found: ${err.message}`));
    });
  });
}

module.exports = { isAvailable, chatStream };
