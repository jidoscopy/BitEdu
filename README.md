BitEdu: AI-Powered Blockchain Learning Platform

A comprehensive educational platform leveraging AI to personalize learning paths for understanding blockchain and Bitcoin, with secure decentralized course certifications on the Stacks blockchain.

🎯 Hackathon Alignment
How BitEdu Unlocks the Bitcoin Economy

BitEdu lowers the barrier to entry into Bitcoin and blockchain by:

Making blockchain education accessible through AI-personalized learning.

Using Stacks smart contracts to issue verifiable, tamper-proof course certifications.

Building a direct pathway for new developers and learners into the Bitcoin ecosystem.

Hackathon Sprint Plan

Sprint 1 (Validate): Finalize problem statement, user journey, and contract design.

Sprint 2 (Build): Implement core Clarity contracts, AI engine integration, and learning dashboard.

Sprint 3 (Pitch): Deploy MVP, refine UI/UX, prepare demo video, and showcase live prototype.

Judging Criteria Mapping
Criteria	How BitEdu Delivers
Technical Quality	AI-driven personalization, Clarity contracts, full-stack dApp.
Security	JWT + wallet auth, validated contracts, secure APIs.
Ease of Use	Intuitive React frontend, gamified learning, progress analytics.
Bitcoin Alignment	Onboards new users into Bitcoin via education + Stacks certifications.
🚀 Features

AI-Powered Personalization: Adaptive learning paths based on individual progress and style

Blockchain Certifications: Tamper-proof certificates stored on Stacks blockchain with Clarity

Comprehensive Curriculum: Bitcoin fundamentals, blockchain, Stacks development, and DeFi

Progress Analytics: Insights into learning patterns and performance

Gamification: Badges, points, and leaderboards

Wallet Integration: Connect Stacks wallet for blockchain interactions

🏗️ Architecture
Smart Contracts (Clarity)

course-certifications.clar: Course creation, enrollment, and certificate issuance

learning-paths.clar: AI-personalized learning path assignments

achievement-system.clar: Badges, points, and gamification

Backend (Node.js/Express)

RESTful API with MongoDB database

JWT authentication with Stacks wallet integration

AI engine integration for personalization

AI Engine (Node.js/TensorFlow)

ML models for learning style classification

Difficulty prediction algorithms

OpenAI integration for adaptive content

Frontend (React/Vite)

Responsive web app with Tailwind CSS

Stacks Connect integration for wallet functionality

Real-time tracking and analytics

🛠️ Installation
# Clone repo
cd BitEdu
npm install

Install Dependencies
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# AI Engine
cd ../ai-engine && npm install

Environment Setup
cp .env.example .env
# Edit .env with configuration

Database
mongod

🚦 Running the Application
npm run dev         # Start all services
npm run dev:backend # Backend API (port 3000)
npm run dev:frontend # Frontend (port 5173)
npm run dev:ai      # AI Engine (port 3001)

📁 Project Structure
BitEdu/
├── contracts/              # Clarity smart contracts
├── backend/                # Node.js backend API
├── frontend/               # React frontend
├── ai-engine/              # AI personalization service
├── tests/                  # Contract unit tests
└── settings/               # Clarinet configuration

🎯 Learning Paths
Bitcoin Fundamentals (Beginner)

What is Bitcoin?

Digital signatures and cryptography

Transactions, wallets, mining

Stacks Development (Intermediate)

Clarity programming

Smart contract development

DApp deployment

Wallet integration

Advanced Topics (Expert)

Layer 2 solutions

Cross-chain protocols

DeFi protocols

Security auditing

🔧 API Endpoints
Authentication

POST /api/auth/register – Register

POST /api/auth/login – Login

POST /api/auth/connect-stacks – Connect wallet

Courses

GET /api/courses – List all

GET /api/courses/:id – Get details

POST /api/courses/:id/enroll – Enroll

POST /api/courses/:id/complete – Complete

Analytics

GET /api/analytics/dashboard – Dashboard

GET /api/analytics/progress/:courseId – Course progress

Certifications

GET /api/certifications – User certificates

POST /api/certifications/verify/:id – Verify

🧪 Testing
npm test            # Run all tests
npm run test:report # Coverage report
npm run test:watch  # Watch mode

🚀 Deployment
Smart Contracts
clarinet integrate # Deploy to testnet

Backend/Frontend

Configure environment variables

Deploy backend to hosting service

Build + deploy frontend to CDN

🔐 Security Features

JWT authentication with Stacks verification

Input validation + sanitization

API rate limiting

Secure smart contract patterns

IPFS for certificate metadata

🌍 Demo Links

Live Demo: [Coming Soon]

Pitch Video: [Coming Soon]

🚀 Roadmap

BTC micropayments for premium courses

AI tutors with BTC tipping

Mobile app for global reach

DAO governance for course creation

🤝 Contributing

Fork repo

Create branch (git checkout -b feature/amazing-feature)

Commit changes

Push branch

Open PR

📄 License

MIT License – see LICENSE file

🆘 Support

Open GitHub issue

Join Discord

Email: support@bitedu.io