// // src/models/PasswordCode.ts
// import mongoose from "mongoose";

// const PasswordCodeSchema = new mongoose.Schema({
//   email:     { type: String, index: true, required: true },
//   codeHash:  { type: String, required: true },
//   used:      { type: Boolean, default: false },
//   expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL auto delete
// });

// export const PasswordCodeModel = mongoose.model("PasswordCode", PasswordCodeSchema);