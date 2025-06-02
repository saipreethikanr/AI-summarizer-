
# AI Notes Application

A modern note-taking application with AI-powered summarization using NVIDIA cloud models, built with React + Vite frontend and Supabase backend.

## Features

- 🔐 **User Authentication** - Secure sign-up and login with Supabase Auth
- 📝 **Create, Edit, Delete Notes** - Full CRUD operations with real-time data persistence
- 📁 **File Upload** - Upload text files as notes
- 📋 **Paste Content** - Directly paste content from clipboard
- 🤖 **AI-Powered Individual Note Summarization** - Summarize individual notes using NVIDIA models
- 🧠 **Bulk Summarization** - Generate comprehensive summaries across all your notes
- 💾 **Real-time Data Persistence** - All data stored securely in Supabase with Row Level Security
- 🚀 **Modern Tech Stack** - React 18, TypeScript, Vite, Tailwind CSS, Supabase
- ⚡ **Responsive Design** - Works perfectly on desktop and mobile

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/ui components
- Lucide icons
- Supabase client for real-time data

**Backend:**
- Supabase (PostgreSQL database, Authentication, Edge Functions)
- NVIDIA cloud models for AI summarization
- Row Level Security for data protection

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- NVIDIA API key for AI features

## Quick Setup

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install
```

### 2. Supabase Setup

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. The database tables and security policies are already configured in this project

### 3. Configure Environment Variables

The Supabase connection is already configured. You just need to add your NVIDIA API key:

**Getting NVIDIA API Key:**
1. Visit [NVIDIA NGC](https://ngc.nvidia.com/)
2. Create an account and log in
3. Go to Setup > Generate API Key
4. Copy your API key

### 4. Add NVIDIA API Key to Supabase

1. Go to your Supabase project dashboard
2. Navigate to Settings > Edge Functions
3. Add a new secret:
   - Name: `NVIDIA_API_KEY`
   - Value: Your NVIDIA API key

### 5. Authentication Setup

1. In your Supabase dashboard, go to Authentication > URL Configuration
2. Set your Site URL to your application URL (for development: `http://localhost:8080`)
3. Add your application URL to Redirect URLs

### 6. Start Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Database Schema

The application uses these Supabase tables:

### notes
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `title` (Text, Required)
- `content` (Text, Required)
- `summary` (Text, Optional - populated by AI)
- `file_name` (Text, Optional - for uploaded files)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### profiles
- `id` (UUID, Primary Key, references auth.users)
- `email` (Text)
- `full_name` (Text)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Security Features

- **Row Level Security (RLS)** - Users can only access their own notes and profile
- **Authentication Required** - All operations require valid user session
- **Secure API Keys** - NVIDIA API key stored securely in Supabase secrets
- **Input Validation** - All user inputs are validated and sanitized

## AI Summarization Features

### Individual Note Summarization
- Click the "AI Summary" button on any note
- Uses NVIDIA's Llama 3.1 Nemotron 70B model
- Generates concise, accurate summaries
- Summaries are saved and displayed with the note

### Bulk Summarization
- Click "Summarize All" in the sidebar
- Analyzes all your notes together
- Identifies common themes and key insights
- Provides comprehensive overview of your note collection

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to [Vercel](https://vercel.com)
3. Vercel will automatically detect it's a Vite project
4. Deploy!

### Deploy to Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to [Netlify](https://netlify.com)
3. Configure redirects for SPA routing

### Other Platforms

The built application (in the `dist` folder after running `npm run build`) can be deployed to any static hosting service.

## Environment Configuration

### Required Supabase Secrets

In your Supabase project settings > Edge Functions, add:

```
NVIDIA_API_KEY=your_nvidia_api_key_here
```

## API Endpoints (Supabase Edge Functions)

- `summarize-note` - Summarizes individual note content
- `summarize-notes` - Provides bulk summarization of multiple notes

## Troubleshooting

### Common Issues

1. **Authentication Issues**
   - Verify Site URL and Redirect URLs in Supabase Auth settings
   - Check if email confirmation is disabled for faster development

2. **Database Connection Issues**
   - Ensure Row Level Security policies are properly configured
   - Verify user is authenticated before performing database operations

3. **AI Summarization Not Working**
   - Check if NVIDIA_API_KEY is properly set in Supabase secrets
   - Verify API key is valid and has sufficient credits
   - Check Edge Function logs in Supabase dashboard

4. **Build/Deploy Issues**
   - Ensure all dependencies are installed: `npm install`
   - Check for TypeScript errors: `npm run build`
   - Clear cache and rebuild: `rm -rf node_modules && npm install`

### Development Tips

- Use browser developer tools to check for console errors
- Monitor Supabase Edge Function logs for API issues
- Test authentication flow in incognito mode
- Use Supabase dashboard to verify data is being stored correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section above
- Review Supabase documentation for database/auth issues
- Check NVIDIA NGC documentation for AI model issues
