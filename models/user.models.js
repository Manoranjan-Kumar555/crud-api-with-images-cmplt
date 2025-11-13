import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER", "OTHER"],
      default: "USER",
      required: true,
    },
  },
  { timestamps: true } // ✅ Automatically adds createdAt & updatedAt
);

const User = mongoose.model("User", userSchema);

export default User;
