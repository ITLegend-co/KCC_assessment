# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-02

### Added
- Initial release of Bouldering Competition Website
- Student registration system with CRUD operations
- Judge scoring system with Fall/Zone/Top tracking
- Real-time ranking calculations with IFSC-style scoring
- Firebase Realtime Database integration
- localStorage fallback for offline support
- Responsive design for mobile and desktop
- Back button navigation on all pages
- Bulk delete functionality for scores
- Checkbox selection (individual and select all)
- Environment variable configuration
- GitHub-friendly documentation

### Features

#### Student Registration
- Add, edit, and delete student records
- Automatic ID generation
- Fields: Name, School, Class, Age
- Real-time sync with Firebase
- Edit functionality with pre-filled forms

#### Judge Scoring
- Student selection dropdown
- Round selection (Qualifier, Semi Final, Final)
- Boulder number input
- Attempt tracking (Fall, Zone, Top)
- Automatic AZ (Attempts to Zone) calculation
- Automatic AT (Attempts to Top) calculation
- Score overwrite confirmation
- Bulk delete with checkbox selection
- Select all/unselect all functionality
- Real-time score table

#### Ranking System
- Live ranking updates
- IFSC-style scoring algorithm
- Round filtering
- Visual hierarchy for top 3 positions
- Tops, Zones, AT, AZ display
- Responsive ranking table

#### Technical Features
- React 18 with TypeScript
- React Router for navigation
- Firebase Realtime Database
- Tailwind CSS v4 styling
- Lucide React icons
- Real-time data synchronization
- Mobile-first responsive design

### Security
- Environment variables for Firebase config
- .gitignore for sensitive files
- Firebase credentials not exposed in code

### Documentation
- Comprehensive README.md
- Contributing guidelines
- Deployment guide
- Environment setup instructions
- MIT License

---

## [Unreleased]

### Planned Features
- User authentication
- Multiple competition support
- Photo uploads for competitors
- PDF report generation
- Export rankings to CSV
- Admin dashboard
- Judge assignment system
- Score verification workflow
- Live leaderboard display mode

---

## How to Update This Changelog

When making changes:
1. Add items under `[Unreleased]`
2. Use categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
3. On release, move unreleased items to new version section
4. Add date in format `YYYY-MM-DD`
