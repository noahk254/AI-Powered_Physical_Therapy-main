#!/bin/bash

# TherapyAI - Start both frontend and backend

echo "Starting TherapyAI services..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill any existing processes on ports 5173 and 8000
echo -e "${YELLOW}Checking for existing processes...${NC}"
lsof -ti:5173 | xargs -r kill -9 2>/dev/null
lsof -ti:8000 | xargs -r kill -9 2>/dev/null

# Start backend in background
echo -e "${GREEN}Starting backend on port 8000...${NC}"
cd "$(dirname "$0")/backend"
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend in background
echo -e "${GREEN}Starting frontend on port 5173...${NC}"
cd "$(dirname "$0")"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}=========================================="
echo -e "  TherapyAI is now running!"
echo -e "=========================================="
echo -e "  Frontend:  ${YELLOW}http://localhost:5173${NC}"
echo -e "  Backend:   ${YELLOW}http://localhost:8000${NC}"
echo -e "  API Docs:  ${YELLOW}http://localhost:8000/docs${NC}"
echo -e "=========================================="
echo ""
echo "Pages available:"
echo "  - Landing:       http://localhost:5173/"
echo "  - Login:         http://localhost:5173/login"
echo "  - Signup:        http://localhost:5173/signup"
echo "  - Patient Dashboard:  http://localhost:5173/dashboard"
echo "  - Doctor Dashboard:   http://localhost:5173/doctor"
echo "  - Exercise:      http://localhost:5173/exercise/:id"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for both processes
wait
