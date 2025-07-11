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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configure Supabase Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Add your site URL to the Site URL field (e.g., `http://localhost:3000`)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`

### 4. Set Up Google OAuth (Optional)

1. Go to Authentication > Providers in Supabase
2. Enable Google provider
3. Add your Google OAuth credentials

### 5. Create Database Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_interests TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── signup/          # User registration
│   │   │   ├── signin/          # User login
│   │   │   ├── verify/          # Email verification
│   │   │   ├── onboarding/      # Legal preferences
│   │   │   └── callback/        # OAuth callback
│   │   ├── dashboard/           # User dashboard
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   └── lib/
│       └── supabase.ts         # Supabase client
├── public/
└── package.json
```

## 🔐 Authentication Flow

1. **Sign Up** (`/auth/signup`)
   - User fills registration form
   - Email verification sent
   - Redirects to verification page with email parameter

2. **Email Verification** (`/auth/verify`)
   - User clicks email link from Supabase
   - Automatically redirects to onboarding
   - Manual verification page available for guidance

3. **Onboarding** (`/auth/onboarding`)
   - User selects legal interests
   - Data saved via `/api/v1/onboarding` endpoint
   - Redirects to dashboard

4. **Sign In** (`/auth/signin`)
   - Email/password login
   - Google OAuth option
   - Password reset functionality

5. **Dashboard** (`/dashboard`)
   - Protected route requiring authentication
   - Shows user-specific content
   - Quick access to features

## 🔐 Session Management

The app implements real-time session management:

- **Authentication State**: Automatically detects user login status
- **Dynamic UI**: Landing page shows different navigation based on auth state
- **Real-time Updates**: UI updates immediately when user signs in/out
- **Persistent Sessions**: User stays logged in across browser sessions
- **Secure Logout**: Properly clears session and redirects to landing page

### Session Behavior:
- **Guest Users**: See "Sign In" and "Get Started" buttons
- **Authenticated Users**: See user name, "Sign Out" button, and "Dashboard" link
- **Loading State**: Shows loading spinner while checking authentication

## 🎨 Customization

### Styling
- Uses Tailwind CSS for styling
- shadcn/ui components for consistent UI
- Customizable color scheme in `tailwind.config.ts`

### Components
- All UI components are in `src/components/ui/`
- Easy to customize and extend

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |

## 📡 API Endpoints

### POST `/api/v1/onboarding`
Saves user onboarding preferences to the database.

**Request Body:**
```json
{
  "legalInterests": ["consumer-rights", "employment-law"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "user_id": "uuid",
    "legal_interests": ["consumer-rights", "employment-law"],
    "onboarding_completed": true
  }
}
```

## 📱 Features

### Landing Page
- Hero section with AI chat interface
- Feature showcase
- Legal document types
- How it works section
- Trust indicators
- Call-to-action sections
- **Dynamic navigation** - Shows logout button for authenticated users
- **Session-aware UI** - Different CTAs based on authentication status

### Authentication
- Email/password registration
- Google OAuth integration
- Email verification
- Password reset
- Secure session management

### User Dashboard
- Welcome message
- Quick access to features
- Recent activity
- User profile management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.
