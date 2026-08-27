# 🧗 Bouldering Competition Website

A modern, responsive web application for managing bouldering competitions. Built with React, TypeScript, and Firebase Realtime Database.

![Bouldering Competition](https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&auto=format&fit=crop)

## ✨ Features

- **Student Registration** - Register competitors with ID, name, school, class, and age
- **Judge Scoring System** - Real-time scoring with IFSC-style attempt tracking (Fall/Zone/Top)
- **Live Rankings** - Automatic ranking calculation with visual hierarchy
- **Firebase Integration** - Real-time data synchronization across multiple devices
- **Responsive Design** - Optimized for both desktop and mobile devices
- **Offline Backup** - LocalStorage fallback for data persistence

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bouldering-competition.git
   cd bouldering-competition
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure Firebase**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_DATABASE_URL=your_database_url_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
   ```

   Get your Firebase credentials from the [Firebase Console](https://console.firebase.google.com/):
   - Create a new project or use an existing one
   - Enable Realtime Database
   - Copy your configuration from Project Settings

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in terminal)

## 📁 Project Structure

```
bouldering-competition/
├── src/
│   ├── app/
│   │   ├── components/        # Reusable React components
│   │   │   └── BackButton.tsx
│   │   ├── lib/              # Utility functions and configs
│   │   │   └── firebase.ts   # Firebase configuration
│   │   ├── pages/            # Main application pages
│   │   │   ├── Home.tsx
│   │   │   ├── StudentRegistration.tsx
│   │   │   ├── JudgeScoring.tsx
│   │   │   └── Ranking.tsx
│   │   ├── App.tsx           # Main app component
│   │   └── routes.ts         # React Router configuration
│   ├── styles/
│   │   ├── theme.css         # CSS theme variables
│   │   └── fonts.css         # Font imports
│   └── main.tsx              # Application entry point
├── .env                      # Environment variables (not committed)
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## 🎯 Usage

### 1. Student Registration (`/registration`)
- Add new competitors with their details
- Edit existing registrations
- Delete competitors
- Automatic ID generation

### 2. Judge Scoring (`/judge`)
- Select student, round, and boulder number
- Track attempts with Fall/Zone/Top buttons
- Automatic calculation of AZ (Attempts to Zone) and AT (Attempts to Top)
- View all scores in real-time table
- Bulk delete scores with checkbox selection

### 3. Ranking (`/ranking`)
- View live rankings by round (Qualifier, Semi Final, Final)
- IFSC-style scoring: Tops > Zones > Attempts to Top (AT) > Attempts to Zone (AZ)
- Visual indicators for top 3 positions
- Real-time updates from Firebase

## 🔥 Firebase Database Structure

```json
{
  "students": {
    "<student_key>": {
      "id": "001",
      "name": "John Doe",
      "school": "ABC School",
      "class": "5E",
      "age": "17"
    }
  },
  "scores": {
    "<score_key>": {
      "id": "001",
      "round": "Qualifier",
      "boulder": 1,
      "at": 2,
      "az": 1
    }
  }
}
```

## 🛠️ Built With

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Firebase** - Realtime database
- **Tailwind CSS v4** - Utility-first styling
- **Lucide React** - Icon library

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 📱 Mobile phones (320px and up)
- 📱 Tablets (768px and up)
- 💻 Desktop computers (1024px and up)

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Keep your Firebase API keys secure
- Configure Firebase Security Rules for production use
- This application is designed for competition use, not for storing sensitive PII

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- IFSC (International Federation of Sport Climbing) for scoring rules
- Unsplash for images
- The React and Firebase communities

## 📧 Support

For support, email your-email@example.com or open an issue in the repository.

---

Made with ❤️ for the bouldering community
