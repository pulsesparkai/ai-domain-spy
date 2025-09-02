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
VITE_POSTHOG_HOST=https://app.posthog.com
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
2. Configure DNS CNAME record:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```
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

### End-to-End Testing Steps:

#### 1. Development Testing
1. **Create Sample Data**: Use the SampleDataScript component in dashboard (dev mode only)
2. **User Registration Flow**:
   - Sign up with test email
   - Verify email confirmation (if enabled)
   - Complete onboarding tour (purple steps, 4 tour stops)
   - Check PostHog events (user_signed_up, page views)

3. **Subscription Testing**:
   - Test Stripe checkout with test cards (4242 4242 4242 4242)
   - Verify subscription status updates in database
   - Check Sentry error capture with intentional test error

4. **Scan Functionality**:
   - Add API keys in Settings (Perplexity, OpenAI)
   - Run sample scan with test domain
   - Verify all 7 dashboard features show real data:
     - Visibility Score (with tooltip showing formula)
     - Citations (competitor analysis)
     - Sentiment (pie chart: green/gray/red)
     - Rankings (color-coded table)
     - Prompt Trends (gained/lost arrows)
     - Competitor Traffic (Google Trends bar chart)
     - Trending Pages (DuckDuckGo search results)
   - Check database for scan results storage
   - Test email notifications via Resend

5. **UI/UX Integration**:
   - Test onboarding tour (react-joyride) with purple #6B5BFF styling
   - Verify tooltips (react-tooltip) with gray #F0F0F0 background, 12px radius
   - Check CodeBlock component displays with Prism.js highlighting (Consolas 14px)
   - Test cookie consent banner (localStorage persistence)
   - Verify homepage gradient (#F8FAFF to #E8EFFF) and stats badges
   - Test testimonials section and FAQ accordion
   - Test export CSV functionality
   - Verify logout functionality

#### 2. Production Testing:
- [ ] User registration and authentication
- [ ] Stripe live payments (use real test cards)
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

3. **Test Stripe Webhooks**: Use Stripe CLI to verify webhook delivery:
   ```bash
   stripe listen --forward-to your-domain.com/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

### 3. Environment Variables Checklist
- [ ] All Stripe keys configured
- [ ] Resend API key working
- [ ] PostHog tracking active (check dashboard for events)
- [ ] Sentry error reporting enabled (test with intentional error)
- [ ] Supabase URLs and keys correct
- [ ] OpenAI and Perplexity API keys in Edge Function secrets

### 4. Testing in Production
- [ ] Complete user registration flow (with email verification if enabled)
- [ ] Test payment processing with real cards
- [ ] Verify email delivery (welcome, subscription, scan results)
- [ ] Check analytics tracking (PostHog events, Sentry errors)
- [ ] Test API key validation in Settings
- [ ] Verify scan functionality with real API calls
- [ ] Test onboarding tour for new users (purple steps, tooltip integration)
- [ ] Verify CodeBlock syntax highlighting in dashboard
- [ ] Test all 7 dashboard features with real scan data
- [ ] Verify cookie consent banner functionality
- [ ] Check competitor traffic analysis (Google Trends integration)
- [ ] Test trending pages discovery (DuckDuckGo Search integration)
- [ ] Verify logout functionality

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