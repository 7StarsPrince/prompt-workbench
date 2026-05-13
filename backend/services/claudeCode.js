const { spawn } = require('child_process');

// Check if Claude Code CLI is installed
async function isAvailable() {
  return new Promise((resolve) => {
    const child = spawn('claude', ['--version'], { shell: true });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

// Stream chat via Claude Code CLI using PTY-like interaction
async function chatStream(message, history = [], onChunk) {
  return new Promise((resolve, reject) => {
    // Claude Code accepts piped input when using --output-format or similar
    // Fallback: use claude with non-interactive mode if available
    const child = spawn('claude', [], {
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let buffer = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      buffer += text;
      
      // Stream chunks as they arrive
      onChunk(text);
      output += text;
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      // Claude Code sometimes outputs progress to stderr
      console.error('Claude Code stderr:', text);
    });

    child.on('close', (code) => {
      if (code !== 0 && !output) {
        reject(new Error(`Claude Code exited with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Claude Code not found: ${err.message}`));
    });

    // Send the message with a clear prompt format
    // Format: clear context + user message + exit command
    const context = history.map(h => `${h.role === 'user' ? 'Human' : 'Assistant'}: ${h.content}`).join('\n\n');
    const prompt = context ? `${context}\n\nHuman: ${message}\n\nAssistant:` : `Human: ${message}\n\nAssistant:`;
    
    child.stdin.write(prompt + '\n');
    
    // After getting response, signal end
    setTimeout(() => {
      child.stdin.write('/exit\n');
      child.stdin.end();
    }, 30000); // 30s timeout
  });
}

module.exports = { isAvailable, chatStream };
