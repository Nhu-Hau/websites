// src/types/express.d.ts
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      userId: string;
      role: string;
    };
    user?: {
      userId: any;
      userId: any;
      userId: any;
      userId: any;
      userId: any;
      userId: any;
      userId: any;
      userId: any;
      id: string;
      name: string;
      role: 'admin' | 'teacher' | 'student';
    };
  }
}
