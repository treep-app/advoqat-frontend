# LegaliQ - AI-Powered Legal Assistant

A comprehensive legal assistance platform built with Next.js, Supabase, and Tailwind CSS.

## 🚀 Features

- **AI Legal Assistant** - Get instant legal advice without authentication
- **User Authentication** - Sign up, sign in, and email verification with Supabase
- **Google OAuth** - Sign in with Google account
- **Password Reset** - Secure password reset functionality
- **Onboarding Preferences** - Select legal interest areas
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Modern UI** - Beautiful interface with shadcn/ui components

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the frontend directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL Configuration
# For development (localhost)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# For production (replace with your actual domain)
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. Configure Supabase Authentication URLs

**Important**: To fix email confirmation redirects, you need to update your Supabase project settings:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > URL Configuration**
3. Update the **Site URL** from `http://localhost:3000` to your actual domain (e.g., `https://yourdomain.com`)
4. Add your domain to the **Redirect URLs** list:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/auth/onboarding`

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔧 Environment Configuration

The app uses environment variables to handle different deployment environments:

- **Development**: Uses `http://localhost:3000`
- **Production**: Uses `NEXT_PUBLIC_SITE_URL` or `VERCEL_URL` (if deployed on Vercel)

This ensures that email confirmation links redirect to the correct domain instead of localhost.

## 🚀 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## 📝 Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features and API.
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS.
- [shadcn/ui Documentation](https://ui.shadcn.com/) - learn about the UI components.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
