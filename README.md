# Cashow

Cashow is a personal finance app designed to make money management clearer, simpler, and more motivating.

Live demo: https://cashow.vercel.app

The idea behind Cashow is straightforward: people do not need complicated tools. They need a clean view of their money, useful insights, and a product that feels good to use every day.

## Why Cashow

Cashow helps users:
- track spending and income in one place
- understand where money is going
- set goals and monitor progress
- discover patterns through AI-powered guidance
- keep the experience local, simple, and easy to trust

## How it works

### 1. Track money in real time
Users can add recurring costs, one-off expenses, salary movements, and category-based spending. The dashboard updates in real time so the financial picture stays clear.

### 2. Understand the flow
Cashow highlights balance changes, spending trends, and the most relevant signals from the last period. The goal is to reduce friction and make financial decisions easier.

### 3. Set goals and stay motivated
Users can create savings or budget goals and follow their progress visually. Progress indicators help turn money management into a daily habit rather than a chore.

### 4. Ask for AI help
The app includes AI-driven financial guidance so users can ask simple questions like:
- How can I save more?
- What changed this month?
- Where am I overspending?

This keeps the experience helpful without being overwhelming.

## Core features

### Smart dashboard
- total balance overview
- spending by category
- period-to-period comparison
- daily financial visibility

### AI insights
- natural-language financial questions
- personalized observations and suggestions
- practical recommendations based on existing habits

### Savings goals
- create and track goals
- view progress with visual indicators
- keep momentum through clear milestones

### Recurring tracking
- monitor subscriptions and regular expenses
- detect patterns in recurring costs
- understand monthly obligations more clearly

### Multi-language support
Cashow is designed for a broader audience and supports multiple languages, including:
- Italian
- English
- Spanish
- French
- German

### Privacy-first experience
The project is designed around personal finance needs while keeping the experience smooth, secure, and simple to use.

## Product experience

Cashow includes two connected experiences:

- a landing page for first-time visitors
- an authenticated product experience for active users

This allows users to:
- discover the app quickly
- try it in guest mode without friction
- create an account when ready
- access the full dashboard and personal finance tools

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase
- React Router
- TanStack Query
- Framer Motion
- Lucide React

## Project structure

```bash
src/
  components/
  hooks/
  pages/
  lib/
  types/
```

## Getting started

### Prerequisites

- Node.js 18+
- npm or bun

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Production build

```bash
npm run build
```

## Environment variables

The app uses environment variables for Supabase and other runtime configuration.

Example:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

This project is intended for deployment on Vercel and is built to support a fast, modern frontend workflow.

## Roadmap

Planned future improvements include:
- smarter automatic recurring detection
- deeper AI coaching on budget behavior
- enhanced reporting and exports
- richer insight cards and recommendations
- mobile-first polish and performance improvements

## About the project

Cashow is a product concept focused on making personal finance feel lighter, more understandable, and more actionable. It is built for people who want clarity without complexity.

## Contact

Built by Jacopo Ferrieri.

Website: https://www.cayn.dev
GitHub: https://github.com/cayn-dev
