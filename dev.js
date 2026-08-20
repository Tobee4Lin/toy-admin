const { spawn } = require('child_process');

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const serverPort = process.env.SERVER_PORT || '3000';
const clientPort = process.env.CLIENT_PORT || '8080';

const server = spawn(npxCmd, ['ts-node', '-P', 'tsconfig.node.local.json', 'server/bootstrap.ts'], {
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'development', SERVER_PORT: serverPort },
  shell: isWindows,
});

const client = spawn(npxCmd, ['vite', '--config', 'vite.local.config.ts', '--port', clientPort], {
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'development' },
  shell: isWindows,
});

function prefix(stream, prefix, dest) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      dest.write(`${prefix} ${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffer) dest.write(`${prefix} ${buffer}\n`);
  });
}

prefix(server.stdout, '\x1b[34m[server]\x1b[0m', process.stdout);
prefix(server.stderr, '\x1b[31m[server-err]\x1b[0m', process.stderr);
prefix(client.stdout, '\x1b[32m[client]\x1b[0m', process.stdout);
prefix(client.stderr, '\x1b[31m[client-err]\x1b[0m', process.stderr);

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\nShutting down...');
  try { server.kill(); } catch (e) { /* noop */ }
  try { client.kill(); } catch (e) { /* noop */ }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('exit', (code) => {
  if (!shuttingDown && code !== 0) {
    console.log(`Server exited with code ${code}`);
    shutdown();
  }
});
client.on('exit', (code) => {
  if (!shuttingDown && code !== 0) {
    console.log(`Client exited with code ${code}`);
    shutdown();
  }
});
