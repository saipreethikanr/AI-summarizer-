# SmartNotes - AI-Powered Note Taking App

A modern note-taking application with AI-powered summarization capabilities built with React, TypeScript, Supabase, and NVIDIA's LLaMA models.

## Features

- **User Authentication**: Secure sign-up and login with Supabase Auth
- **Note Management**: Create, edit, delete, and organize your notes
- **File Upload**: Upload text documents (.txt, .md) directly to create notes
- **AI Summarization**: Generate intelligent summaries using NVIDIA's LLaMA 3 70B model
- **Real-time Storage**: All data stored securely in Supabase
- **Responsive Design**: Beautiful UI that works on all devices

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Git

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Supabase Edge Functions (set in Supabase Dashboard -> Settings -> Edge Functions)
NVIDIA_API_KEY=your_nvidia_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd smartnotes
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key from Settings -> API

#### Database Setup
Run the following SQL in your Supabase SQL Editor:

```sql
-- Create a profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create a table for notes
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_name TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create policies for notes table
CREATE POLICY "Users can view their own notes" 
  ON public.notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
  ON public.notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
  ON public.notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
  ON public.notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Create a trigger to automatically create a profile when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

#### Deploy Edge Function
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-id`
4. Deploy the function: `supabase functions deploy summarize`

#### Set Environment Variables in Supabase
1. Go to Supabase Dashboard -> Settings -> Edge Functions
2. Add the following secrets:
   - `NVIDIA_API_KEY`: Your NVIDIA API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 4. Get NVIDIA API Key

1. Visit [NVIDIA NGC](https://catalog.ngc.nvidia.com/)
2. Create an account and generate an API key
3. Add it to your Supabase Edge Function secrets

### 5. Configure Authentication

1. In Supabase Dashboard, go to Authentication -> Settings
2. Disable email confirmations for development (optional)
3. Configure any additional auth providers as needed

### 6. Update Environment Variables

Create a `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 7. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn UI components
│   ├── FileUpload.tsx  # File upload component
│   └── NoteCard.tsx    # Individual note card
├── pages/              # Page components
│   ├── Login.tsx       # Authentication page
│   ├── Dashboard.tsx   # Main dashboard
│   └── NotFound.tsx    # 404 page
├── hooks/              # Custom React hooks
│   └── useAuth.tsx     # Authentication hook
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
└── utils/              # Utility functions

supabase/
└── functions/
    └── summarize/      # AI summarization edge function
        └── index.ts
```

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI**: NVIDIA LLaMA 3 70B via NVIDIA API
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6

## Features in Detail

### Authentication
- Email/password authentication via Supabase Auth
- Automatic profile creation on signup
- Protected routes and user session management

### Note Management
- Create notes with custom titles
- Upload text files (.txt, .md) to create notes
- Edit notes inline
- Delete notes with confirmation
- Real-time data synchronization

### AI Summarization
- Individual note summarization
- Bulk summarization of all notes
- Powered by NVIDIA's LLaMA 3 70B model
- Error handling and user feedback

### File Upload
- Support for text files (.txt, .md)
- File size validation (max 5MB)
- Automatic title generation from filename
- File content preview

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   - Verify your environment variables are correct
   - Check that your Supabase project is active
   - Ensure RLS policies are properly configured

2. **AI Summarization Not Working**
   - Verify NVIDIA API key is set in Supabase Edge Function secrets
   - Check Edge Function logs in Supabase Dashboard
   - Ensure the summarize function is deployed

3. **File Upload Issues**
   - Check file size (must be under 5MB)
   - Ensure file is a supported text format
   - Verify storage bucket permissions

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Ensure database tables and policies are created
