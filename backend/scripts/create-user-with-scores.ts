/**
 * Script to create a user with fake TOEIC placement test scores and self-reported scores
 * Usage: npx ts-node scripts/create-user-with-scores.ts <email> <password> <fullName> <selfReportedScore> <placementScore>
 * Example: npx ts-node scripts/create-user-with-scores.ts user@example.com 123456 "John Doe" 650 680
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { User } from "../src/shared/models/User";
import { PlacementAttempt } from "../src/shared/models/PlacementAttempt";
import { ProgressAttempt } from "../src/shared/models/ProgressAttempt";
import { connectMongo } from "../src/config/database";

async function generateFakeItems(
  level: 1 | 2 | 3,
  total: number,
  correct: number
) {
  const parts = ["1", "2", "3", "4", "5", "6", "7"];
  const items = [];
  let correctCount = 0;

  for (let i = 0; i < total; i++) {
    const shouldBeCorrect = correctCount < correct;
    correctCount += shouldBeCorrect ? 1 : 0;

    items.push({
      id: `item-${i + 1}`,
      part: parts[Math.floor(Math.random() * parts.length)],
      picked: shouldBeCorrect ? "A" : "B",
      correctAnswer: "A",
      isCorrect: shouldBeCorrect,
    });
  }

  return items;
}

function scoreToLevel(score: number): 1 | 2 | 3 {
  if (score < 330) return 1;
  if (score < 660) return 2;
  return 3;
}

function calculatePredictedScores(
  total: number,
  correct: number,
  targetScore?: number
): { overall: number; listening: number; reading: number } {
  // If target score provided, use it directly and calculate sections
  if (targetScore !== undefined) {
    // Reading thường cao hơn Listening một chút (tỷ lệ 48% Listening, 52% Reading)
    const listeningScore = Math.round(targetScore * 0.48);
    const readingScore = targetScore - listeningScore;
    
    return {
      overall: targetScore,
      listening: Math.min(495, Math.max(5, listeningScore)),
      reading: Math.min(495, Math.max(5, readingScore)),
    };
  }

  // Otherwise calculate from accuracy
  const acc = (correct / total) * 100;

  // Normalize to 0-100
  const listeningAcc = acc;
  const readingAcc = acc;

  // Round to 5-point increments
  const round5 = (n: number) => Math.round(n / 5) * 5;

  // Convert to TOEIC scores (5-495 for each section)
  const listeningScore = round5(5 + (listeningAcc / 100) * 490);
  const readingScore = round5(5 + (readingAcc / 100) * 490);
  const overallScore = round5(listeningScore + readingScore);

  return {
    overall: Math.min(990, Math.max(10, overallScore)),
    listening: Math.min(495, Math.max(5, listeningScore)),
    reading: Math.min(495, Math.max(5, readingScore)),
  };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 5) {
    console.log(
      "Usage: npx ts-node scripts/create-user-with-scores.ts <email> <password> <fullName> <selfReportedScore> <placementScore>"
    );
    console.log(
      "Example: npx ts-node scripts/create-user-with-scores.ts user@example.com 123456 \"John Doe\" 650 680"
    );
    process.exit(1);
  }

  const [email, password, fullName, selfReportedScoreStr, placementScoreStr] =
    args;
  const selfReportedScore = parseInt(selfReportedScoreStr, 10);
  const placementScore = parseInt(placementScoreStr, 10);

  if (isNaN(selfReportedScore) || isNaN(placementScore)) {
    console.error("Error: Scores must be valid numbers");
    process.exit(1);
  }

  if (
    selfReportedScore < 10 ||
    selfReportedScore > 990 ||
    placementScore < 10 ||
    placementScore > 990
  ) {
    console.error("Error: TOEIC scores must be between 10 and 990");
    process.exit(1);
  }

  try {
    await connectMongo();
    console.log("✓ Connected to database");

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error(`Error: User with email ${email} already exists`);
      process.exit(1);
    }

    // Create user
    const user = new User({
      name: fullName,
      email,
      password,
      role: "user",
      access: "free",
      currentToeicSource: "self_report_official",
      currentToeicScore: selfReportedScore,
      currentToeicExamDate: new Date().toISOString().split("T")[0],
    });

    await user.save();
    console.log(`✓ Created user: ${email} (${fullName})`);

    // Generate fake placement test
    const placementLevel = scoreToLevel(placementScore);
    const placementTotal = 55; // Standard placement test has 55 questions
    const placementCorrect = Math.round((placementScore / 990) * placementTotal);

    const placementItems = await generateFakeItems(
      placementLevel,
      placementTotal,
      placementCorrect
    );

    const placementPredicted = calculatePredictedScores(
      placementTotal,
      placementCorrect,
      placementScore
    );

    const placementAttempt = new PlacementAttempt({
      userId: user._id,
      total: placementTotal,
      correct: placementCorrect,
      acc: (placementCorrect / placementTotal) * 100,
      listening: {
        total: Math.ceil(placementTotal / 2),
        correct: Math.ceil(placementCorrect / 2),
        acc: (Math.ceil(placementCorrect / 2) / Math.ceil(placementTotal / 2)) *
          100,
      },
      reading: {
        total: Math.floor(placementTotal / 2),
        correct: Math.floor(placementCorrect / 2),
        acc: (Math.floor(placementCorrect / 2) / Math.floor(placementTotal / 2)) *
          100,
      },
      level: placementLevel,
      items: placementItems,
      predicted: placementPredicted,
      weakParts: [],
      allIds: placementItems.map((_, i) => `item-${i + 1}`),
      timeSec: Math.random() * 3600 + 1800, // Random 30-90 minutes
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      version: "1.0.0",
    });

    await placementAttempt.save();
    console.log(
      `✓ Created placement test attempt (score: ${placementPredicted.overall})`
    );

    // Update user with placement attempt info and toeicPred
    user.lastPlacementAttemptId = placementAttempt._id;
    user.toeicPred = {
      overall: placementPredicted.overall,
      listening: placementPredicted.listening,
      reading: placementPredicted.reading,
    };
    user.partLevels = {
      "1": placementLevel,
      "2": placementLevel,
      "3": placementLevel,
      "4": placementLevel,
      "5": placementLevel,
      "6": placementLevel,
      "7": placementLevel,
    };

    await user.save();
    console.log("✓ Updated user with placement test results");

    // Generate fake progress test (1-2 weeks after placement)
    const progressLevel = scoreToLevel(placementScore + Math.random() * 100 - 50);
    const progressTotal = 200; // Full test has ~200 questions
    const progressCorrect = Math.round((placementScore / 990) * progressTotal);

    const progressItems = await generateFakeItems(
      progressLevel,
      progressTotal,
      progressCorrect
    );

    // Progress test can vary slightly (±50 points)
    const progressScoreVariation = Math.floor(Math.random() * 100) - 50;
    const progressTargetScore = Math.min(990, Math.max(10, placementScore + progressScoreVariation));
    
    const progressPredicted = calculatePredictedScores(
      progressTotal,
      progressCorrect,
      progressTargetScore
    );

    const progressAttempt = new ProgressAttempt({
      userId: user._id,
      total: progressTotal,
      correct: progressCorrect,
      acc: (progressCorrect / progressTotal) * 100,
      listening: {
        total: 100,
        correct: Math.floor(progressCorrect / 2),
        acc: (Math.floor(progressCorrect / 2) / 100) * 100,
      },
      reading: {
        total: 100,
        correct: Math.ceil(progressCorrect / 2),
        acc: (Math.ceil(progressCorrect / 2) / 100) * 100,
      },
      level: progressLevel,
      items: progressItems,
      predicted: progressPredicted,
      weakParts: [],
      allIds: progressItems.map((_, i) => `item-${i + 1}`),
      timeSec: Math.random() * 4500 + 3600, // Random 60-135 minutes
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      version: "1.0.0",
    });

    await progressAttempt.save();
    console.log(
      `✓ Created progress test attempt (score: ${progressPredicted.overall})`
    );

    console.log("\n=== User Created Successfully ===");
    console.log(`Email: ${email}`);
    console.log(`Name: ${fullName}`);
    console.log(`Self-Reported Score: ${selfReportedScore}`);
    console.log(`Placement Test Score: ${placementPredicted.overall}`);
    console.log(`Progress Test Score: ${progressPredicted.overall}`);
    console.log(`Predicted Scores: L:${placementPredicted.listening} R:${placementPredicted.reading}`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
