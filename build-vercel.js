const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Starting InsightPilot Universal Build ---');

try {
  // 1. Install frontend dependencies
  console.log('Installing frontend dependencies...');
  execSync('npm --prefix frontend install', { stdio: 'inherit' });

  // 2. Run next build inside frontend
  console.log('Building Next.js frontend application...');
  execSync('npm --prefix frontend run build', { stdio: 'inherit' });

  // 3. Mirror .next build artifacts to root for zero-config root Vercel deployments
  const srcNext = path.join(__dirname, 'frontend', '.next');
  const destNext = path.join(__dirname, '.next');

  if (fs.existsSync(srcNext)) {
    console.log('Mirroring .next build folder to root...');
    if (fs.existsSync(destNext)) {
      fs.rmSync(destNext, { recursive: true, force: true });
    }
    fs.cpSync(srcNext, destNext, { recursive: true });
    console.log('Successfully mirrored .next to root!');
  }

  console.log('--- Build completed with 100% SUCCESS! ---');
} catch (error) {
  console.error('Build failed with error:', error);
  process.exit(1);
}
