import dotenv from "dotenv";
import express from "express";
import { MulterError } from "multer";
import path from "path";
import { connectDB } from "./config/db.js";
import studentRoutes from "./routes/student.routes.js";
import cors from "cors";
import { fileURLToPath } from "url";
import auth from "./middleware/auth.js";
import userRoutes from "./routes/user.routes.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 8081;

// ✅ Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Connect MongoDB
connectDB();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // allow frontend connection (React)

// ✅ Static folder for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// ✅ Serve Static Files
app.use(express.static(path.join(process.cwd(), "public")));

// ✅ Health Check Route
app.get("/test", (req, res) => {
  const formattedDateTime = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });

  res.json({
    success: true,
    message: "Welcome to CRUD Operation Tutorial!",
    datetime: formattedDateTime,
  });
});

// ✅ Home Route
app.get("/", (req, res) => {
  res.send("Home Page!");
});

// ✅ Student Routes
app.use("/api/users", userRoutes);
app.use(auth);
app.use("/api/students", studentRoutes);

// ✅ Global Error Handling Middleware
app.use((error, req, res, next) => {
  console.error("🔥 Global Error:", error.message);

  // ✅ Handle Multer file upload errors
  if (error instanceof MulterError) {
    let message = "File upload failed.";

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Maximum size allowed is 3MB.";
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Too many files uploaded or unexpected field name.";
    }

    return res.status(400).json({
      success: false,
      type: "upload_error",
      message,
      details: error.message,
    });
  }

  // ✅ Handle Validation / Custom Errors
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      type: "validation_error",
      message: error.message,
    });
  }

  // ✅ Fallback for Other Errors
  return res.status(500).json({
    success: false,
    type: "server_error",
    message: "Something went wrong on the server.",
    details: error.message || "Unknown error occurred.",
  });
});

// ✅ Catch-All 404 Route
// app.use((req, res) => {
//   res.status(404).render("404", { title: "Page Not Found" });
// });

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log("🟢 Environment:", process.env.NODE_ENV || "development");
});
