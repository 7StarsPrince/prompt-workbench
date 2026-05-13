const { spawn } = require('child_process');

// Check if Claude Code CLI is installed
async function isAvailable() {
  return new Promise((resolve) => {
    const child = spawn('claude', ['--version'], { shell: true });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Use Claude Code in --print (non-interactive) mode with stream-json output.
 * 
 * Claude Code outputs NDJSON (newline-delimited JSON) where each line is:
 * - stream_event with content_block_delta / text_delta (streaming text)
 * - assistant (final assembled message)
 * - result (summary with cost, tokens, etc.)
 * 
 * We extract only text_delta chunks for real-time streaming to the user.
 */
async function chatStream(message, history = [], onChunk) {
  return new Promise((resolve, reject) => {
    // Build prompt with history context
    let prompt = message;
    if (history.length > 0) {
      const context = history
        .map(h => `${h.role === 'user' ? 'Human' : 'Assistant'}: ${h.content}`)
        .join('\n\n');
      prompt = `${context}\n\nHuman: ${message}`;
    }

    const args = [
      '--print',
      '--verbose',
      '--output-format=stream-json',
      '--include-partial-messages',
      prompt
    ];

    const child = spawn('claude', args, {
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        NO_COLOR: '1',
        CLAUDE_CODE_DISABLE_TELEMETRY: '1'
      }
    });

    let buffer = '';
    let hasOutput = false;
    let fullText = '';

    child.stdout.on('data', (data) => {
      buffer += data.toString();
      hasOutput = true;

      // Process NDJSON lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line);

          // Skip system/init events
          if (parsed.type === 'system') continue;

          // Skip result/summary events (contains cost, tokens, etc.)
          if (parsed.type === 'result') continue;

          // Stream events: extract text_delta chunks
          if (parsed.type === 'stream_event' && parsed.event) {
            const evt = parsed.event;

            // content_block_delta with text_delta
            if (evt.type === 'content_block_delta' && evt.delta) {
              if (evt.delta.type === 'text_delta' && evt.delta.text) {
                fullText += evt.delta.text;
                onChunk(evt.delta.text);
              }
              // thinking_delta is internal reasoning, skip
            }

            // message_stop indicates end of stream
            if (evt.type === 'message_stop') {
              // streaming complete
            }
          }

          // assistant event: final assembled message (fallback)
          if (parsed.type === 'assistant' && parsed.message && parsed.message.content) {
            const textParts = parsed.message.content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join('');

            if (textParts && textParts.length > fullText.length) {
              // Send any remaining text we might have missed
              const remaining = textParts.slice(fullText.length);
              if (remaining) {
                fullText = textParts;
                onChunk(remaining);
              }
            }
          }

        } catch (err) {
          // Not valid JSON, might be plain text or partial line
          // Keep in buffer for next data event
        }
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      // Filter out progress messages
      if (text.includes('Loading') || text.includes('Thinking') || text.includes('API')) {
        return;
      }
      if (text.trim() && !text.includes('\u001b[')) {
        onChunk(text);
      }
    });

    child.on('close', (code) => {
      // Flush remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.type === 'assistant' && parsed.message && parsed.message.content) {
            const textParts = parsed.message.content
              .filter(c => c.type === 'text')
              .map(c => c.text)
              .join('');
            if (textParts && textParts.length > fullText.length) {
              const remaining = textParts.slice(fullText.length);
              if (remaining) onChunk(remaining);
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      if (code !== 0 && !hasOutput) {
        reject(new Error(`Claude Code exited with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Claude Code not found: ${err.message}`));
    });

    // Timeout after 3 minutes
    setTimeout(() => {
      child.kill();
      if (hasOutput) {
        resolve();
      } else {
        reject(new Error('Claude Code timed out'));
      }
    }, 180000);
  });
}

module.exports = { isAvailable, chatStream };
