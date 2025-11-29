#!/bin/bash
# Usage: ./scripts/create-user-with-scores.sh <email> <password> <fullName> <selfReportedScore> <placementScore>
# Example: ./scripts/create-user-with-scores.sh test@example.com password123 "Test User" 650 680

cd "$(dirname "$0")/.."
npx ts-node backend/scripts/create-user-with-scores.ts "$@"
