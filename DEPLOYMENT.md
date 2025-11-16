# Deployment Guide

This guide covers different deployment options for LangLens, from development to production environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
  - [Vercel](#vercel-recommended)
  - [Docker](#docker)
  - [Self-Hosted (Node.js)](#self-hosted-nodejs)
  - [Static Export](#static-export)
- [Production Checklist](#production-checklist)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev --turbo

# Open http://localhost:3000
```

### Production Build

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

## Environment Configuration

### Environment Variables

LangLens uses minimal environment configuration. Create a `.env.local` file for local development:

```env
# .env.local (for local development)
NODE_ENV=development

# Optional: Custom LangGraph server URL (client-side)
# NEXT_PUBLIC_API_URL=http://localhost:2024

# Optional: Skip environment validation (for Docker builds)
# SKIP_ENV_VALIDATION=1
```

### Adding New Environment Variables

1. **Define in `src/env.js`:**

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  // Server-side variables (not exposed to client)
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
  },

  // Client-side variables (must be prefixed with NEXT_PUBLIC_)
  client: {
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
  },

  // Map to process.env
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

2. **Add to `.env.example`:**

```env
# .env.example
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:2024
```

3. **Use in code:**

```typescript
import { env } from "@/env";

const apiUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:2024";
```

### LangGraph Server Configuration

The LangGraph server URL is configured in `src/lib/api/client.ts`:

```typescript
import { Client } from "@langchain/langgraph-sdk";

export const apiClient = new Client({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:2024",
});
```

**To change the server URL:**
1. Set `NEXT_PUBLIC_API_URL` environment variable, OR
2. Edit `src/lib/api/client.ts` directly

## Deployment Options

### Vercel (Recommended)

Vercel is the recommended platform for deploying LangLens, as it's built by the creators of Next.js.

#### Deploy with Vercel CLI

1. **Install Vercel CLI:**

```bash
npm install -g vercel
```

2. **Login to Vercel:**

```bash
vercel login
```

3. **Deploy:**

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Deploy with GitHub Integration

1. **Push to GitHub:**

```bash
git push origin main
```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings (auto-detected)
   - Add environment variables
   - Deploy

#### Vercel Configuration

Create `vercel.json` (optional):

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

#### Environment Variables on Vercel

1. Go to Project Settings → Environment Variables
2. Add variables:
   - `NEXT_PUBLIC_API_URL` - Your LangGraph server URL
3. Redeploy for changes to take effect

**Important:** Ensure your LangGraph server is accessible from the internet and allows CORS from your Vercel domain.

---

### Docker

#### Dockerfile

Create a `Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Skip environment validation during build
ENV SKIP_ENV_VALIDATION=1

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Note:** Enable standalone output in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
};

export default config;
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  langlens:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://langgraph:2024
    depends_on:
      - langgraph
    restart: unless-stopped

  # Optional: Include your LangGraph server
  langgraph:
    image: your-langgraph-image:latest
    ports:
      - "2024:2024"
    restart: unless-stopped
```

#### Build and Run

```bash
# Build image
docker build -t langlens:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://your-langgraph-server:2024 \
  langlens:latest

# Or use Docker Compose
docker-compose up -d
```

---

### Self-Hosted (Node.js)

Deploy to your own server with Node.js.

#### Requirements

- Node.js 18 or higher
- pnpm 10.20.0
- Process manager (PM2 recommended)
- Reverse proxy (nginx/caddy recommended)

#### Deployment Steps

1. **Clone repository:**

```bash
git clone https://github.com/yourusername/lang-lens.git
cd lang-lens
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Build application:**

```bash
pnpm build
```

4. **Start with PM2:**

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "langlens" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

5. **Configure nginx (reverse proxy):**

```nginx
# /etc/nginx/sites-available/langlens
server {
    listen 80;
    server_name langlens.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

6. **Enable site and reload nginx:**

```bash
sudo ln -s /etc/nginx/sites-available/langlens /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

7. **Add SSL with Let's Encrypt:**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d langlens.yourdomain.com
```

#### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'langlens',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'http://localhost:2024',
    },
  }],
};
```

Then start with:

```bash
pm2 start ecosystem.config.js
```

---

### Static Export

**Note:** LangLens relies on server-side features and real-time streaming, so full static export is **not recommended**. However, you can export static pages for specific routes if needed.

For static export, you would need to:
1. Remove streaming features
2. Use client-side data fetching only
3. Configure `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default config;
```

**This is not recommended for LangLens.**

## Production Checklist

### Before Deployment

- [ ] Run all checks: `pnpm check`
- [ ] Test production build: `pnpm build && pnpm start`
- [ ] Set `NODE_ENV=production`
- [ ] Configure LangGraph server URL
- [ ] Set up CORS on LangGraph server
- [ ] Review security headers
- [ ] Enable HTTPS/SSL
- [ ] Configure error tracking (optional)
- [ ] Set up monitoring (optional)
- [ ] Test all critical flows

### Security

1. **HTTPS/SSL:**
   - Always use HTTPS in production
   - Configure SSL certificates (Let's Encrypt)

2. **CORS Configuration:**
   - Configure LangGraph server to allow requests from your domain
   - Don't use `*` wildcard in production

3. **Environment Variables:**
   - Never commit `.env` files
   - Use platform's secret management
   - Validate all environment variables

4. **Security Headers:**

Add to `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const config = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default config;
```

### Performance

1. **Build Optimization:**
   - Ensure production build is optimized
   - Check bundle size: `pnpm build`
   - Enable compression (gzip/brotli)

2. **Caching:**
   - Configure CDN caching for static assets
   - Set appropriate cache headers
   - Use Next.js image optimization

3. **Monitoring:**
   - Monitor response times
   - Track error rates
   - Set up uptime monitoring

## Performance Optimization

### Next.js Optimizations

1. **Image Optimization:**

```tsx
import Image from "next/image";

<Image
  src="/logo.png"
  alt="Logo"
  width={100}
  height={100}
  priority // For above-the-fold images
/>
```

2. **Font Optimization:**

```tsx
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

3. **Bundle Analysis:**

```bash
# Install bundle analyzer
pnpm add -D @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(config);

# Run analysis
ANALYZE=true pnpm build
```

### CDN Configuration

For Vercel, CDN is automatic. For self-hosted:

1. **Use Cloudflare:**
   - Add site to Cloudflare
   - Configure DNS
   - Enable caching rules

2. **Cache Headers:**

```nginx
# nginx
location /_next/static/ {
    alias /app/.next/static/;
    expires 1y;
    access_log off;
    add_header Cache-Control "public, immutable";
}
```

## Monitoring & Logging

### Error Tracking

Integrate error tracking (optional):

**Sentry Example:**

```bash
pnpm add @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Uptime Monitoring

Use uptime monitoring services:
- [UptimeRobot](https://uptimerobot.com/)
- [Pingdom](https://www.pingdom.com/)
- [Better Uptime](https://betteruptime.com/)

### Application Logs

**Development:**
```bash
pnpm dev
```

**Production (PM2):**
```bash
pm2 logs langlens
pm2 logs langlens --err  # Error logs only
```

**Docker:**
```bash
docker logs langlens-container
docker logs -f langlens-container  # Follow logs
```

## Troubleshooting

### Common Issues

#### Build Failures

**Type errors:**
```bash
pnpm typecheck
# Fix all type errors
```

**Dependency issues:**
```bash
rm -rf node_modules .next
pnpm install
pnpm build
```

#### Runtime Errors

**Connection to LangGraph server fails:**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify LangGraph server is running
- Check CORS configuration
- Verify network connectivity

**Blank page in production:**
- Check browser console for errors
- Verify all environment variables are set
- Check server logs
- Ensure build completed successfully

#### Performance Issues

**Slow page loads:**
- Check bundle size with analyzer
- Optimize images
- Enable compression
- Use CDN for static assets

**High memory usage:**
- Check for memory leaks (React DevTools Profiler)
- Optimize TanStack Query cache settings
- Use production build (not development)

### Debug Mode

Enable debug logging:

```bash
# Development
DEBUG=* pnpm dev

# Production
NODE_OPTIONS='--inspect' pnpm start
```

### Health Checks

Create a health check endpoint (optional):

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

Test:
```bash
curl https://your-domain.com/api/health
```

## Scaling

### Horizontal Scaling

For high traffic:

1. **Use multiple instances:**
   - PM2 cluster mode (already configured)
   - Kubernetes deployment
   - Cloud auto-scaling groups

2. **Load Balancing:**
   - nginx load balancer
   - Cloud load balancer (AWS ELB, GCP LB)

3. **Caching:**
   - CDN for static assets
   - Redis for API caching (if needed)

### Database Considerations

LangLens doesn't have a database, but your LangGraph server likely does:
- Ensure database can handle load
- Use connection pooling
- Consider read replicas
- Implement caching

## Backup & Recovery

### What to Backup

- Environment configuration
- Custom modifications
- Deployment scripts

### Recovery

```bash
# Restore from git
git clone https://github.com/yourusername/lang-lens.git
pnpm install
pnpm build
pnpm start
```

## Further Reading

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines
