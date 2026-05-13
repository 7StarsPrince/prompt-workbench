const { spawn } = require('child_process');

// Check if local OpenClaw is available (CLI)
async function isAvailable() {
  return new Promise((resolve) => {
    const child = spawn('openclaw', ['--version'], { shell: true });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Use OpenClaw CLI: `openclaw agent --message "..." --json`
 * 
 * This runs one agent turn via the Gateway and returns the response.
 * We use --json for structured output and stream the response in real-time.
 */
async function chatStream(message, history = [], onChunk) {
  return new Promise((resolve, reject) => {
    // Build context with history if any
    let fullMessage = message;
    if (history.length > 0) {
      const context = history
        .map(h => `${h.role === 'user' ? 'Human' : 'Assistant'}: ${h.content}`)
        .join('\n\n');
      fullMessage = `${context}\n\nHuman: ${message}`;
    }

    const args = [
      'agent',
      '--message', fullMessage,
      '--json',
      '--verbose', 'on'
    ];

    const child = spawn('openclaw', args, {
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        NO_COLOR: '1'
      }
    });

    let buffer = '';
    let hasOutput = false;
    let responseText = '';

    child.stdout.on('data', (data) => {
      buffer += data.toString();
      hasOutput = true;

      // Try to parse JSON output
      try {
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const parsed = JSON.parse(line);
            // Extract response text from various possible fields
            const text = parsed.response || parsed.content || parsed.text || 
                        parsed.reply || parsed.message || 
                        (parsed.result && parsed.result.response);
            
            if (text && text !== responseText) {
              const newChunk = text.slice(responseText.length);
              responseText = text;
              if (newChunk) onChunk(newChunk);
            }
          } catch {
            // Not JSON, might be plain text
            if (line.trim()) {
              responseText += line + '\n';
              onChunk(line + '\n');
            }
          }
        }
      } catch {
        // If buffer processing fails, just stream raw
        const text = data.toString();
        responseText += text;
        onChunk(text);
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      // Filter out config warnings and progress messages
      if (text.includes('Config warnings') || 
          text.includes('plugin') ||
          text.includes('Loading') ||
          text.includes('Thinking')) {
        return;
      }
      // Some useful output might go to stderr
      if (text.trim() && !text.includes('\u001b[')) {
        onChunk(text);
      }
    });

    child.on('close', (code) => {
      // Flush remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          const text = parsed.response || parsed.content || parsed.text || 
                      parsed.reply || parsed.message;
          if (text && text.length > responseText.length) {
            const remaining = text.slice(responseText.length);
            if (remaining) onChunk(remaining);
          }
        } catch {
          if (buffer.trim()) {
            onChunk(buffer);
          }
        }
      }

      if (code !== 0 && !hasOutput) {
        reject(new Error(`OpenClaw exited with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(new Error(`OpenClaw not found: ${err.message}`));
    });

    // Timeout after 3 minutes
    setTimeout(() => {
      child.kill();
      if (hasOutput) {
        resolve();
      } else {
        reject(new Error('OpenClaw timed out'));
      }
    }, 180000);
  });
}

module.exports = { isAvailable, chatStream };
