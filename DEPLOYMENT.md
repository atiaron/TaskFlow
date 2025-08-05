# TaskFlow Deployment Guide

## 🚀 Deployment Options

### Frontend Deployment

#### Option 1: Netlify (Recommended)
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to Netlify:
   - Upload the `build/` folder to Netlify
   - Or connect your GitHub repo for auto-deployment
   - Set build command: `cd frontend && npm run build`
   - Set publish directory: `frontend/build`

3. Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-domain.com
   ```

#### Option 2: Vercel
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   cd frontend
   vercel --prod
   ```

3. Configure:
   - Build command: `npm run build`
   - Output directory: `build`
   - Install command: `npm install`

### Backend Deployment

#### Option 1: Railway (Recommended)
1. Connect your GitHub repo to Railway
2. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   ANTHROPIC_API_KEY=your_key_here
   FRONTEND_URL=https://your-frontend-domain.com
   ```
3. Railway will auto-deploy on push

#### Option 2: Heroku
1. Create Heroku app:
   ```bash
   heroku create taskflow-backend
   ```

2. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set ANTHROPIC_API_KEY=your_key_here
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   ```

3. Deploy:
   ```bash
   git subtree push --prefix backend heroku main
   ```

#### Option 3: Docker Deployment
1. Create Dockerfile for backend:
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

2. Build and run:
   ```bash
   docker build -t taskflow-backend .
   docker run -p 3001:3001 -e ANTHROPIC_API_KEY=your_key taskflow-backend
   ```

## 🔧 Production Configuration

### Backend Environment Variables
```bash
NODE_ENV=production
PORT=3001
ANTHROPIC_API_KEY=your_anthropic_key_here
FRONTEND_URL=https://your-frontend-domain.com
LOG_LEVEL=info
```

### Frontend Environment Variables
```bash
REACT_APP_API_URL=https://your-backend-domain.com
```

### Firebase Setup for Production
1. Add your production domain to Firebase Auth authorized domains
2. Update CORS settings if needed
3. Configure Firestore security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /tasks/{taskId} {
         allow read, write: if request.auth != null && 
                           request.auth.uid == request.resource.data.userId;
       }
     }
   }
   ```

## 🔐 Security Considerations

### Environment Variables
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly

### Firebase Security
- Implement proper Firestore security rules
- Enable App Check for additional security
- Monitor authentication logs

### CORS Configuration
- Configure CORS to only allow your frontend domain
- Remove wildcard (*) origins in production

### HTTPS
- Always use HTTPS in production
- Configure proper SSL certificates
- Redirect HTTP to HTTPS

## 📊 Monitoring & Analytics

### Recommended Services
- **Error Tracking**: Sentry
- **Performance**: Google Analytics, Vercel Analytics
- **Uptime Monitoring**: UptimeRobot
- **Logs**: LogRocket, Logtail

### Health Checks
The backend includes a health check endpoint:
```
GET /health
```

Use this for monitoring and load balancer health checks.

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy TaskFlow
on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - run: cd frontend && npm ci && npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=frontend/build
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - run: cd backend && npm ci && npm run build
      - # Deploy to your backend hosting service
```

## 🚀 Performance Optimization

### Frontend
- Enable React production build optimization
- Use code splitting and lazy loading
- Implement service worker for caching
- Optimize images and assets
- Use CDN for static assets

### Backend
- Enable compression middleware
- Implement rate limiting
- Use connection pooling for databases
- Cache frequently accessed data
- Optimize API response sizes

## 📱 Progressive Web App (PWA)

The frontend is configured as a PWA:
- Manifest.json included
- Service worker ready
- Installable on mobile devices
- Offline functionality (partial)

To enhance PWA features:
1. Implement offline task storage
2. Add background sync
3. Configure push notifications
4. Optimize for different screen sizes

## 🔍 Troubleshooting Production Issues

### Common Issues
1. **CORS errors**: Check FRONTEND_URL environment variable
2. **Firebase auth issues**: Verify authorized domains
3. **API rate limits**: Implement request throttling
4. **Memory issues**: Monitor heap usage, implement garbage collection

### Debugging Tools
- Browser developer tools
- Server logs
- Error tracking services
- Performance monitoring
- Network analysis tools

---

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify environment variables
3. Test API endpoints manually
4. Check third-party service status
5. Open an issue on GitHub

Happy deploying! 🎉