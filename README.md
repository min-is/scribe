# 🩺 Scribe Dashboard

A comprehensive medical scribe dashboard for managing physician schedules, preferences, and EPIC documentation resources. Built with Next.js 15, TypeScript, and PostgreSQL.

## ✨ Features

- **Built-in Authentication** - Secure NextAuth.js-based authentication
- **Physician Schedules** - View and manage physician availability (Coming Soon)
- **Physician Preferences** - Track physician-specific note requirements (Coming Soon)
- **EPIC Dot Phrases** - Common templates and documentation shortcuts (Coming Soon)
- **Dark/Light Mode** - Full theme support with system detection
- **Tag Organization** - Organize resources with tags
- **Admin Dashboard** - Complete administrative interface
- **IBM Plex Mono** - Beautiful monospace typography

## 🛠️ Installation

### 1. Deploy to Railway.app

This project is optimized for deployment on Railway.app:

1. Fork or clone this repository
2. Create a new project on [Railway.app](https://railway.app)
3. Connect your GitHub repository
4. Add required services:
   - PostgreSQL database
   - (Optional) Redis for caching

### 2. Configure Environment Variables

Add the following environment variables in Railway:

#### Required
- `POSTGRES_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Generate a secure secret ([use this tool](https://generate-secret.vercel.app/32))
- `ADMIN_EMAIL` - Admin user email
- `ADMIN_PASSWORD` - Admin user password

#### Optional
- `NEXT_PUBLIC_DOMAIN` - Your production domain (e.g., scribes.yourhospital.com)
- `NEXT_PUBLIC_NAV_TITLE` - Custom navigation title
- `NEXT_PUBLIC_NAV_CAPTION` - Subtitle text
- `NEXT_PUBLIC_DEFAULT_THEME` - `light`, `dark`, or `system` (default)
- `OPENAI_SECRET_KEY` - For AI-powered features (optional)
- `KV_URL` - Redis URL for rate limiting (optional)

### 3. Deploy

1. Push to your GitHub repository
2. Railway will automatically deploy your application
3. Visit the provided URL and navigate to `/sign-in`
4. Sign in with your admin credentials

## 💻 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/min-is/luminous.git
   cd luminous
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local` (if available)
   - Add your local database connection and auth credentials

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## 🎨 Customization

### Theme

The dashboard uses a custom Tailwind CSS theme with utility classes:

- **Text colors**: `text-main`, `text-dim`, `text-medium`
- **Backgrounds**: `bg-main`, `bg-dim`, `bg-medium`
- **Borders**: `border-main`, `border-medium`

Customize colors in `tailwind.css` or set theme preference via `NEXT_PUBLIC_DEFAULT_THEME`.

### Typography

The project uses IBM Plex Mono throughout. Font files are located in `/public/fonts/`.

## 📁 Project Structure

```
/app                    # Next.js App Router pages
  /admin               # Admin dashboard pages
  /sign-in             # Authentication page
  page.tsx             # Homepage
  layout.tsx           # Root layout

/src
  /admin               # Admin components
  /auth                # Authentication logic
  /components          # Reusable UI components
  /state               # Global state management
  /utility             # Helper functions
  /platforms           # Database & service integrations

/public
  /fonts               # IBM Plex Mono font files
```

## 🔧 Tech Stack

- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript 5.8
- **Database**: PostgreSQL (via `pg`)
- **Authentication**: NextAuth.js 5.0
- **Styling**: Tailwind CSS 4.1.7
- **UI Components**: Radix UI primitives
- **State Management**: React Context API
- **Icons**: React Icons
- **Notifications**: Sonner

## 📖 Available Routes

### Public
- `/` - Homepage with dashboard overview
- `/sign-in` - Authentication page

### Admin (Protected)
- `/admin` - Admin dashboard home
- `/admin/tags` - Manage resource tags
- `/admin/configuration` - View system configuration
- `/admin/insights` - Analytics and insights
- `/admin/components` - UI component showcase

## 🚀 Deployment Checklist

- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Generate and set `AUTH_SECRET`
- [ ] Set admin credentials
- [ ] Configure custom domain (optional)
- [ ] Test authentication flow
- [ ] Verify database connection

## 🔐 Security

- All admin routes require authentication
- Passwords are hashed using NextAuth.js
- Environment variables are kept secure
- Database uses SSL by default (disable with `DISABLE_POSTGRES_SSL=1` if needed)

## 📝 License

This project is built on top of the [EXIF Photo Blog template](https://github.com/sambecker/exif-photo-blog) and maintains its original license structure.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for medical scribes
