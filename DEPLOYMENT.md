# PulseSpark.ai - Production Deployment Guide

## Environment Variables Setup

### Required Secrets for Production:

#### Stripe (Payment Processing)
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Resend (Email Service)
```
RESEND_API_KEY=re_...
```

#### Analytics & Monitoring
```
VITE_POSTHOG_KEY=phc_...
VITE_SENTRY_DSN=https://...@o...ingest.sentry.io/...
```

#### Supabase (Database & Auth)
```
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### API Keys (User-provided via Settings)
- Users configure their own API keys via the Settings page
- Keys are stored securely in Supabase user metadata
- Perplexity: `user.user_metadata.api_keys.perplexity`
- OpenAI: `user.user_metadata.api_keys.openai`

## Deployment Instructions

### 1. GitHub Export
1. Connect your GitHub account in Lovable
2. Export the project to a new repository
3. Clone the repository locally

### 2. Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy

### 3. Custom Domain Setup
1. Add domain `app.pulsespark.ai` in Vercel
2. Configure DNS CNAME record pointing to Vercel
3. Enable SSL certificate

### 4. Supabase Production Setup
1. Create production Supabase project
2. Run migrations to create required tables
3. Configure RLS policies
4. Update environment variables with production URLs

## Required Database Tables

### profiles
- user_id (uuid, references auth.users)
- email (text, unique)
- full_name (text)
- subscription_status (text, default: 'trial')
- subscription_tier (text)
- api_keys (jsonb, default: '{}')
- stripe_customer_id (text)
- trial_ends_at (timestamp)

### scans
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- scan_type (text)
- target_url (text)
- results (jsonb)
- status (text, default: 'pending')
- created_at (timestamp)
- updated_at (timestamp)

## Row Level Security (RLS) Policies

All tables have RLS enabled with user-specific access:
- Users can only view/edit their own data
- Edge functions use service role key to bypass RLS

## Testing Checklist

### Pre-Production Testing:
- [ ] User registration and authentication
- [ ] Stripe test payments (use test cards)
- [ ] Email delivery (welcome, scan complete, receipts)
- [ ] API key validation and storage
- [ ] Scan functionality with real APIs
- [ ] Export functionality
- [ ] Fair use limits and subscription checks
- [ ] Paywall display for free users
- [ ] Settings page functionality

### Production Monitoring:
- [ ] Supabase dashboard for database monitoring
- [ ] Vercel analytics for performance
- [ ] Stripe dashboard for payment tracking
- [ ] Resend dashboard for email delivery
- [ ] PostHog dashboard for user analytics
- [ ] Sentry dashboard for error monitoring
- [ ] Console logs for error tracking

## Post-Deployment Steps

### 1. Supabase Configuration
1. **Verify RLS Policies**: Ensure all tables have proper RLS enabled
   ```sql
   -- Check RLS status
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Test Authentication Flow**:
   - Verify email confirmation (if enabled)
   - Test password reset flow
   - Check redirect URLs in Supabase Auth settings

3. **Webhook Verification**:
   - Test Stripe webhooks with test payments
   - Verify webhook endpoints respond correctly
   - Check webhook signature validation

### 2. DNS Configuration
1. **Custom Domain Setup** (app.pulsespark.ai):
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

2. **Verify SSL Certificate**: Ensure HTTPS is working correctly

### 3. Environment Variables Checklist
- [ ] All Stripe keys configured
- [ ] Resend API key working
- [ ] PostHog tracking active
- [ ] Sentry error reporting enabled
- [ ] Supabase URLs and keys correct

### 4. Testing in Production
- [ ] Complete user registration flow
- [ ] Test payment processing with real cards
- [ ] Verify email delivery
- [ ] Check analytics tracking
- [ ] Test API key validation
- [ ] Verify scan functionality

## Security Considerations

1. **API Keys**: User API keys stored encrypted in Supabase
2. **RLS Policies**: Enforce user data isolation
3. **Environment Variables**: Securely configured in Vercel
4. **Webhook Verification**: Stripe webhooks verified with signatures
5. **CORS**: Properly configured for frontend-backend communication

## Scaling Considerations

1. **Rate Limiting**: Implement per-user API rate limits
2. **Caching**: Cache scan results for similar queries
3. **Database Indexing**: Index user_id columns for performance
4. **CDN**: Use Vercel's CDN for static assets
5. **Edge Functions**: Utilize Supabase Edge Functions for scalability