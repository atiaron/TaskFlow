#!/bin/bash

# TaskFlow Development Setup Script

echo "🚀 TaskFlow Development Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d. -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
if npm install; then
    print_status "Root dependencies installed"
else
    print_warning "Root dependencies installation had issues, continuing..."
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
if npm install; then
    print_status "Frontend dependencies installed"
else
    print_error "Frontend dependencies installation failed"
    cd ..
    exit 1
fi
cd ..

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    print_status "Backend dependencies installed"
else
    print_warning "Backend dependencies installation had issues"
    print_warning "The application may still work with limited backend functionality"
fi
cd ..

# Setup environment files
echo ""
echo "⚙️  Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_status "Backend .env file created from example"
    print_warning "Please edit backend/.env and add your Anthropic API key"
else
    print_status "Backend .env file already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    print_status "Frontend .env file created from example"
else
    print_status "Frontend .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit backend/.env and add your Anthropic API key (optional)"
echo "   2. Run 'npm run dev' to start both frontend and backend"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "🔗 Useful commands:"
echo "   npm run dev          # Start both frontend and backend"
echo "   npm run dev:frontend # Start only frontend"
echo "   npm run dev:backend  # Start only backend"
echo "   npm run build        # Build for production"
echo ""
echo "📚 For more help, see SETUP.md"