// backend/src/config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";

export function initPassport() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (_at, _rt, profile, done) => {
        const email = profile.emails?.[0]?.value || "";
        return done(null, {
          email,
          displayName: profile.displayName,
          id: profile.id,
          photo: profile.photos?.[0]?.value,
        });
      }
    )
  );
}

export default passport;

