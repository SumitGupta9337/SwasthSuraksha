#!/bin/bash

echo "🚀 SwasthSuraksha Deployment Script"
echo "=================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Check if user is logged in
echo "🔐 Checking Firebase login..."
if ! firebase projects:list &> /dev/null; then
    echo "Please login to Firebase..."
    firebase login --no-localhost
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Firebase
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting --project swasthsuraksha-84d00

echo "✅ Deployment complete!"
echo "🌐 Your app should be live at: https://swasthsuraksha-84d00.web.app"