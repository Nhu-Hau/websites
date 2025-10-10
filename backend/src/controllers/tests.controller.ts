import { Request, Response } from "express";
import { ToeicTest, IToeicTest } from "../models/Test";
import { User, IUser } from "../models/User";

/** Lấy level của viewer: nếu chưa login => 1 */
async function getViewerLevel(req: Request): Promise<1 | 2 | 3 | 4> {
  const userId = (req as any).auth?.userId as string | undefined;
  if (!userId) return 1;

  // Ép kiểu lean để TS biết có field level
  // Nếu IUser của bạn có level: 1|2|3|4 (number) thì dùng IUser luôn.
  // Nếu lo user.level đôi khi là string -> dùng UserLevelOnly cho an toàn.
  type UserLevelOnly = Pick<IUser, "level">;

  const user = await User.findById(userId).lean<UserLevelOnly | null>();
  if (!user) return 1;

  const raw = (user as any).level; // có thể là number hoặc string (tùy schema cũ)
  const n = typeof raw === "number" ? raw : Number(raw);
  const safe = Math.min(4, Math.max(1, n || 1)) as 1 | 2 | 3 | 4;
  return safe;
}

/** GET /api/tests
 * Trả danh sách test có level <= viewerLevel
 */
export async function listVisibleTests(req: Request, res: Response) {
  try {
    const viewerLevel = await getViewerLevel(req);

    type ListItem = Pick<
      IToeicTest,
      | "testId"
      | "title"
      | "totalQuestions"
      | "totalDurationMin"
      | "access"
      | "isFeatured"
      | "version"
      | "level"
    >;

    const tests = await ToeicTest.find({
      level: { $lte: viewerLevel },
      isActive: { $ne: false },
    })
      .select({
        _id: 0,
        testId: 1,
        title: 1,
        totalQuestions: 1,
        totalDurationMin: 1,
        access: 1,
        isFeatured: 1,
        version: 1,
        level: 1,
      })
      .sort({ level: 1, createdAt: -1 })
      .lean<ListItem[]>();

    return res.json({ items: tests, viewerLevel });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Không tải được danh sách đề" });
  }
}

function partDisplay(partKey: string) {
  const mapName: Record<string, string> = {
    "part.1": "Part 1 - Mô tả tranh",
    "part.2": "Part 2 - Hỏi - đáp",
    "part.3": "Part 3 - Đoạn hội thoại",
    "part.4": "Part 4 - Bài nói ngắn",
    "part.5": "Part 5 - Hoàn thành câu",
    "part.6": "Part 6 - Hoàn thành đoạn văn",
    "part.7": "Part 7 - Đọc hiểu",
  };
  const n = Number(partKey.match(/\d+/)?.[0] || 0);
  const group = n <= 4 ? "Listening" : "Reading";
  return { title: mapName[partKey] ?? partKey, group: group as "Listening" | "Reading" };
}

/** GET /api/tests/:testId
 * Trả overview test + các part (id, title, questionCount, group)
 * Chặn nếu level test > level viewer
 */
export async function getTestOverview(req: Request, res: Response) {
  try {
    const viewerLevel = await getViewerLevel(req);
    const { testId } = req.params;

    const test = await ToeicTest.findOne({ testId })
      .select({ _id: 0 })
      .lean<IToeicTest | null>();

    if (!test) return res.status(404).json({ message: "Không tìm thấy test" });

    if (test.level > viewerLevel) {
      return res.status(403).json({ message: "Chưa mở khóa level cho bài test này" });
    }

    type PartInfo = {
      id: string; // "part.1"..."part.7"
      title: string;
      questionCount: number;
      group: "Listening" | "Reading";
    };

    const parts: PartInfo[] = [];
    const sections = Array.isArray(test.sections) ? test.sections : [];

    for (const sec of sections) {
      const partObj = (sec as any)?.parts as Record<string, string[]> | undefined;
      if (!partObj) continue;

      for (const pk of Object.keys(partObj)) {
        const ids = Array.isArray(partObj[pk]) ? partObj[pk] : [];
        const { title, group } = partDisplay(pk);
        parts.push({
          id: pk,
          title,
          questionCount: ids.length,
          group,
        });
      }
    }

    parts.sort((a, b) => {
      const na = Number(a.id.match(/\d+/)?.[0] || 0);
      const nb = Number(b.id.match(/\d+/)?.[0] || 0);
      return na - nb;
    });

    return res.json({
      test: {
        testId: test.testId,
        title: test.title,
        totalQuestions: test.totalQuestions,
        totalDurationMin: test.totalDurationMin,
        access: test.access,
        level: test.level,
        version: test.version,
      },
      parts,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Không tải được overview" });
  }
}

