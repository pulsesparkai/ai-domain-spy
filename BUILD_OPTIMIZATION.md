# Build Scripts for Different Environments

## Development Build
```bash
npm run build:dev
```

## Staging Build
```bash
npm run build:staging
```

## Production Build
```bash
npm run build:prod
```

## Production Build with Bundle Analysis
```bash
npm run build:analyze
```

## Build Performance Guidelines

### Chunk Splitting Strategy
- **react-vendor**: Core React libraries (~100KB)
- **ui-vendor**: Radix UI components (~200KB)
- **charts-vendor**: Recharts library (~150KB)
- **api-vendor**: API clients (~80KB)
- **utils-vendor**: Utility libraries (~50KB)

### Bundle Size Targets
- **Main bundle**: < 200KB
- **Vendor chunks**: < 300KB each
- **Route chunks**: < 100KB each
- **Total bundle**: < 1MB

### Performance Optimizations Applied
1. **Code Splitting**: Automatic route-based and manual vendor splitting
2. **Tree Shaking**: Dead code elimination
3. **Compression**: Gzip and Brotli compression
4. **Source Maps**: Hidden in production for debugging
5. **Asset Optimization**: Images and fonts optimized
6. **CDN Support**: Optional CDN deployment with external dependencies

### Environment Configurations
- **Development**: Fast builds, inline source maps, no compression
- **Staging**: Optimized builds, hidden source maps, compression enabled
- **Production**: Fully optimized, PWA enabled, analytics enabled

### Deployment Checklist
- [ ] Environment variables configured
- [ ] CDN URLs updated (if using CDN)
- [ ] Bundle size under targets
- [ ] PWA manifest configured
- [ ] Analytics tracking enabled
- [ ] Error monitoring configured

### Monitoring
- Use `npm run build:analyze` to generate bundle analysis
- Monitor bundle sizes with `stats.html`
- Check compression ratios in build output
- Verify PWA functionality with Lighthouse