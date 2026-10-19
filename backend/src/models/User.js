import mongoose from "mongoose";
import { APPROVAL_STATUS, ACCOUNT_STATUS } from "../constants/accountStatus.js";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  loginId: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 50 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  accountType: { type: String, enum: ["admin", "user"], default: "user", immutable: true },
  emailVerifiedAt: { type: Date, default: null },
  approvalStatus: { type: String, enum: Object.values(APPROVAL_STATUS), default: APPROVAL_STATUS.PENDING },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  rejectionReason: { type: String, maxlength: 500, default: null },
  accountStatus: { type: String, enum: Object.values(ACCOUNT_STATUS), default: ACCOUNT_STATUS.ACTIVE },
  lastLoginAt: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null }
}, { timestamps: true, minimize: false });

userSchema.index({ approvalStatus: 1, emailVerifiedAt: 1 });

userSchema.virtual("isEmailVerified").get(function () {
  return Boolean(this.emailVerifiedAt);
});

export default mongoose.model("User", userSchema);
