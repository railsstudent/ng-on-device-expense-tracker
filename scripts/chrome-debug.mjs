#!/usr/bin/env node

import { spawn, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

function getChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const paths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  return paths.find((p) => fs.existsSync(p)) || null;
}

const CONFIG = {
  port: 9222,
  chromeBinPath: getChromePath(),
  debugProfileDir: path.join(os.tmpdir(), 'chrome-debug-profile'),
  defaultProfileDir: path.join(os.homedir(), 'Library/Application Support/Google/Chrome'),
};

const TARGET_PORT_FILE = path.join(CONFIG.defaultProfileDir, 'DevToolsActivePort');

function killProcessOnPort(port) {
  try {
    const processIds = execSync(`lsof -ti :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
    for (const processId of processIds) process.kill(Number(processId), 'SIGKILL');
  } catch {
    // Port already free
  }
}

async function fetchDevToolsWebSocketPath(port, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        if (data.webSocketDebuggerUrl) {
          return new URL(data.webSocketDebuggerUrl).pathname;
        }
      }
    } catch {
      // Chrome has not started listening yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

async function startChrome(daemon = true) {
  console.log('🚀 Setting up isolated Chrome DevTools instance for macOS...');
  if (!CONFIG.chromeBinPath) {
    console.error('❌ Chrome binary not found in standard macOS locations.');
    process.exit(1);
  }

  killProcessOnPort(CONFIG.port);
  fs.mkdirSync(CONFIG.debugProfileDir, { recursive: true });
  fs.mkdirSync(CONFIG.defaultProfileDir, { recursive: true });

  console.log(`🌐 Launching Chrome (Port: ${CONFIG.port})...`);
  const proc = spawn(
    CONFIG.chromeBinPath,
    [
      `--remote-debugging-port=${CONFIG.port}`,
      `--user-data-dir=${CONFIG.debugProfileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-sync',
    ],
    { detached: daemon, stdio: daemon ? 'ignore' : 'inherit' },
  );
  if (daemon) proc.unref();

  console.log('⏳ Querying Chrome DevTools WebSocket details over HTTP...');
  const wsPath = await fetchDevToolsWebSocketPath(CONFIG.port, 10000);
  if (!wsPath) {
    console.error('❌ Error: Timed out waiting for Chrome DevTools server.');
    process.exit(1);
  }

  // Manually write the DevToolsActivePort file to the correct target location
  const fileContent = `${CONFIG.port}\n${wsPath}\n`;
  fs.writeFileSync(TARGET_PORT_FILE, fileContent, 'utf8');
  console.log(`\n🎉 Chrome Ready! Active Port: ${CONFIG.port}`);
  console.log(`📝 DevToolsActivePort written to: ${TARGET_PORT_FILE}`);
  console.log(`🔗 WS Path: ${wsPath}`);

  if (!daemon) {
    console.log('\nPress Ctrl+C to stop Chrome and remove config...');
    process.on('SIGINT', () => {
      stopChrome();
      process.exit(0);
    });
  }
}

function stopChrome() {
  console.log('🛑 Stopping Chrome DevTools instance...');
  killProcessOnPort(CONFIG.port);
  fs.rmSync(TARGET_PORT_FILE, { force: true });
  if (fs.existsSync(CONFIG.debugProfileDir)) {
    fs.rmSync(CONFIG.debugProfileDir, { recursive: true, force: true });
    console.log('🧹 Cleaned up temporary profile.');
  }
  console.log('✅ Chrome debug process stopped.');
}

function statusChrome() {
  const inUse = (() => {
    try {
      return (
        execSync(`lsof -ti :${CONFIG.port}`, { stdio: ['pipe', 'pipe', 'ignore'] })
          .toString()
          .trim().length > 0
      );
    } catch {
      return false;
    }
  })();
  const fileExists = fs.existsSync(TARGET_PORT_FILE);
  console.log('=== Chrome DevTools Status ===');
  console.log(`Binary: ${CONFIG.chromeBinPath || 'NOT FOUND'}`);
  console.log(`Port ${CONFIG.port} Active: ${inUse ? '🟢 YES' : '🔴 NO'}`);
  console.log(`DevToolsActivePort File: ${fileExists ? '🟢 VALID' : '🔴 MISSING'}`);
}

const args = process.argv.slice(2);
const command = args[0] || 'start';

if (command === 'start') {
  const isForeground = args.includes('--foreground') || args.includes('-f');
  await startChrome(!isForeground);
} else if (command === 'stop') {
  stopChrome();
} else if (command === 'status') {
  statusChrome();
} else {
  console.log('Usage: node scripts/chrome-debug.mjs [start|stop|status]');
  process.exit(1);
}
