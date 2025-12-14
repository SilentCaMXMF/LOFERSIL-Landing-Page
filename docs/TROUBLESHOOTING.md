# Deployment Troubleshooting Quick Reference

## 🚨 Emergency Fixes

### Build Failed

```bash
rm -rf dist node_modules package-lock.json
npm install
npm run build:prod
```

### Deployment Stuck

1. Cancel GitHub Actions workflow
2. Check Vercel dashboard for stuck deployments
3. Restart deployment: `gh workflow run "Deploy to Vercel"`

### API Not Working

```bash
# Test environment variables
curl https://lofersil.pt/api/test-env

# Check Vercel function logs
# Dashboard → Functions → View logs
```

## 🔍 Common Issues

| Issue                  | Cause                | Solution                          |
| ---------------------- | -------------------- | --------------------------------- |
| **Build fails**        | Missing dependencies | `npm install`                     |
| **TypeScript errors**  | Type issues          | `npx tsc --noEmit`                |
| **CSS not loading**    | PostCSS config       | Check `postcss.config.js`         |
| **API 500 error**      | Missing env vars     | Set Vercel environment variables  |
| **Deployment timeout** | Large assets         | Optimize images, check build size |
| **CORS errors**        | Origin mismatch      | Update `CORS_ORIGIN` env var      |

## 🛠️ Debug Commands

```bash
# Build verification
npm run build:prod && ls -la dist/

# TypeScript check
npx tsc --noEmit

# Lint check
npm run lint

# Environment test
curl https://lofersil.pt/api/test-env

# Headers check
curl -I https://lofersil.pt
```

## 📊 Monitoring

- **GitHub Actions**: Repository → Actions tab
- **Vercel**: Dashboard → Functions tab
- **Analytics**: Vercel Analytics dashboard
- **Performance**: Google PageSpeed Insights

## 🆘 Get Help

1. **GitHub Issues**: Create new issue with error logs
2. **Vercel Docs**: https://vercel.com/docs
3. **Team Chat**: #deployment-support channel
4. **Emergency**: Contact DevOps lead directly

---

**Remember**: Check environment variables first - 80% of issues are env-related!
