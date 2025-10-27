//backend/src/services/recommendation.service.ts
import { PracticeAttempt } from "../models/PracticeAttempt";
import { User } from "../models/User";

const LISTENING = new Set(["part.1","part.2","part.3","part.4"]);
const READING   = new Set(["part.5","part.6","part.7"]);

function accToLevel(acc:number): 1|2|3 {
  if (acc >= 0.70) return 3;
  if (acc >= 0.55) return 2;
  return 1;
}

// làm “EMA” độ chính xác theo part để mượt
function combineAcc(prevAcc:number|undefined, newAcc:number, alpha=0.3){
  if (prevAcc===undefined || isNaN(prevAcc)) return newAcc;
  return (1-alpha)*prevAcc + alpha*newAcc;
}

function round5(x:number, min:number, max:number){
  const r = Math.round(x/5)*5;
  return Math.min(max, Math.max(min, r));
}

export async function recomputeUserRecommendations(userId: string) {
  // lấy 20 lần luyện mới nhất
  const attempts = await PracticeAttempt.find({ userId }).sort({ submittedAt: -1 }).limit(20).lean();

  // EMA theo từng part
  const emaAcc: Record<string, number> = {};
  for (const a of attempts) {
    emaAcc[a.partKey] = combineAcc(emaAcc[a.partKey], a.acc);
  }

  // gợi ý level theo part
  const partLevels: Record<string, 1|2|3> = {};
  Object.entries(emaAcc).forEach(([partKey, acc])=>{
    partLevels[partKey] = accToLevel(acc);
  });

  // điểm TOEIC dự đoán từ EMA trung bình L/R
  let Lsum=0, Lcnt=0, Rsum=0, Rcnt=0;
  Object.entries(emaAcc).forEach(([k,acc])=>{
    if (LISTENING.has(k)) { Lsum += acc; Lcnt++; }
    else if (READING.has(k)) { Rsum += acc; Rcnt++; }
  });
  const Lacc = Lcnt? Lsum/Lcnt : 0;
  const Racc = Rcnt? Rsum/Rcnt : 0;

  const predListening = round5(Lacc*495, 5, 495);
  const predReading   = round5(Racc*495, 5, 495);
  const predOverall   = round5(predListening+predReading, 10, 990);

  await User.findByIdAndUpdate(userId, {
    $set: {
      partLevels,
      toeicPred: { overall: predOverall, listening: predListening, reading: predReading },
      level: accToLevel((Lacc+Racc)/2),           // tuỳ bạn: có thể cập nhật level tổng
      levelUpdatedAt: new Date(),
      levelSource: "placement",                    // hoặc “practice” nếu muốn
    }
  }, { new:true });

  return { partLevels, predicted: { overall: predOverall, listening: predListening, reading: predReading } };
}