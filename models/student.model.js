import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    profile_pic: {
      type: String,
    },
  },
  { timestamps: true } // ✅ Correct way to enable createdAt & updatedAt
);

const Students = mongoose.model("Students", studentSchema);

export default Students;
