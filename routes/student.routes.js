import express from "express";
import multer from "multer";
import path from "path";
import Students from "../models/student.model.js";
import fs from "fs";

const router = express.Router();

// ✅ Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Folder to store uploaded files
  },
  filename: (req, file, cb) => {
    const newFileName = Date.now() + path.extname(file.originalname);
    cb(null, newFileName); // File name: timestamp + extension
  },
});

// ✅ File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Accept image files
  } else {
    cb(new Error("Only image files are allowed!"), false); // Reject non-images
  }
};

// ✅ Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 3, // 3MB file size limit
  },
});

// ✅ Get All Students (Production-Ready)
router.get("/", async (req, res) => {
  try {
    const students = await Students.find();

    // ⚠️ If no records found
    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found in the database.",
        data: [],
      });
    }

    // ✅ Successful response
    return res.status(200).json({
      success: true,
      count: students.length,
      message: "Students fetched successfully.",
      data: students,
    });
  } catch (error) {
    console.error("❌ Error fetching students:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error while fetching students.",
      error: error.message,
    });
  }
});

// ✅ Get Single Student by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ID format (prevents CastError from Mongoose)
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format.",
      });
    }

    // ✅ Fetch student by ID
    const student = await Students.findById(id);

    // ⚠️ If no record found
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found in the database.",
      });
    }

    // ✅ Success response
    return res.status(200).json({
      success: true,
      message: "Student fetched successfully.",
      data: student,
    });
  } catch (error) {
    console.error("❌ Error fetching student by ID:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error while fetching a student.",
      error: error.message,
    });
  }
});

// ✅ Add New Student
router.post("/", upload.single("profile_pic"), async (req, res) => {
  try {
    const { first_name, last_name, email, phone, gender } = req.body;

    // ✅ Validate required fields
    if (!first_name || !last_name || !email || !phone || !gender) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (first name, last name, email, phone, gender) are required.",
      });
    }

    // ✅ Check for duplicate email or phone
    const existingStudent = await Students.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Student with this email or phone already exists.",
      });
    }

    // ✅ Get uploaded file path (if available)
    const profile_pic = req.file ? req.file.filename : null;

    console.log(req.file);
    //     {
    //   fieldname: 'profile_pic',
    //   originalname: 'hook-step.png',
    //   encoding: '7bit',
    //   mimetype: 'image/png',
    //   destination: './uploads',
    //   filename: '1762855672966.png',
    //   path: 'uploads/1762855672966.png',
    //   size: 665867
    // }
    // ✅ Create new student entry
    const newStudent = new Students({
      first_name,
      last_name,
      email,
      phone,
      gender,
      profile_pic,
    });

    // ✅ Save to database
    const savedStudent = await newStudent.save();

    // ✅ Send success response
    return res.status(201).json({
      success: true,
      message: "🎉 New student added successfully.",
      data: savedStudent,
    });
  } catch (error) {
    console.error("❌ Error adding new student:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error while adding student.",
      error: error.message,
    });
  }
});

// ✅ Update Student by ID
router.put("/:id", upload.single("profile_pic"), async (req, res) => {
  try {
    const studentId = req.params.id;
    const { first_name, last_name, email, phone, gender } = req.body;

    // ✅ Validate Student ID format
    if (!studentId || studentId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing Student ID.",
      });
    }

    // ✅ Find the existing student
    const existingStudent = await Students.findById(studentId);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // ✅ Prevent duplicate email or phone (if updated)
    if (email || phone) {
      const duplicateCheck = await Students.findOne({
        $or: [{ email }, { phone }],
        _id: { $ne: studentId },
      });

      if (duplicateCheck) {
        return res.status(409).json({
          success: false,
          message:
            "Another student with the same email or phone already exists.",
        });
      }
    }

    // ✅ Handle profile picture update
    let updatedProfilePic = existingStudent.profile_pic;
    if (req.file) {
      // Delete old profile picture if exists
      if (existingStudent.profile_pic) {
        const oldImagePath = path.join("uploads", existingStudent.profile_pic);
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err)
              console.warn("⚠️ Failed to delete old image:", err.message);
          });
        }
      }
      // Assign new uploaded file
      updatedProfilePic = req.file.filename;
    }

    // ✅ Prepare updated data
    const updatedData = {
      ...(first_name && { first_name }),
      ...(last_name && { last_name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(gender && { gender }),
      profile_pic: updatedProfilePic,
      updatedAt: new Date(),
    };

    // ✅ Update student in DB
    const updatedStudent = await Students.findByIdAndUpdate(
      studentId,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    // ✅ Success Response
    return res.status(200).json({
      success: true,
      message: "✅ Student updated successfully.",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("❌ Update Student Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error while updating student.",
      error: error.message,
    });
  }
});

// ✅ Delete a Student by ID
router.delete("/:id", async (req, res) => {
  try {
    const studentId = req.params.id;

    // ✅ Validate ID format
    if (!studentId || studentId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing student ID in URL.",
      });
    }

    // ✅ Check if student exists
    const student = await Students.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // ✅ Delete associated profile image (if exists)
    if (student.profile_pic) {
      const imagePath = path.join("uploads", student.profile_pic);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.warn("⚠️ Could not delete profile image:", err.message);
        } else {
          console.log("🗑️ Profile image deleted:", imagePath);
        }
      });
    }

    // ✅ Delete student record
    await Students.findByIdAndDelete(studentId);

    // ✅ Success response
    return res.status(200).json({
      success: true,
      message: `🗑️ Student '${student.first_name} ${student.last_name}' deleted successfully.`,
      deletedId: studentId,
    });
  } catch (error) {
    console.error("❌ Delete Student Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting student.",
      error: error.message,
    });
  }
});

export default router;
