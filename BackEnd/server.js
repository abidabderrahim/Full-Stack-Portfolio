import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import "./config/passport.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import subscriberRoutes from "./routes/subscribers.js";
import postsSearchRoute from "./routes/search.js";
import postscategoryRoutes from "./routes/category.js";
import commentRoutes from "./routes/commentRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import userRoutes from "./routes/users.js";
import contactRoutes from "./routes/contact.js";
import path from "path";
import { fileURLToPath } from "url";


dotenv.config();
connectDB();

const app = express();

// --- Security Middlewares ---
app.use(helmet()); // Sets secure HTTP headers

// --- Rate Limiter for all requests ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});
app.use(limiter);

// --- CORS ---
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  })
);

// --- JSON + Cookie Parser ---
app.use(express.json());
app.use(cookieParser());

// --- Session Configuration ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// --- Passport ---
app.use(passport.initialize());
app.use(passport.session());

// --- Static files ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// --- Routes ---
app.use("/api/categories", categoryRoutes);
app.use("/api/posts/search", postsSearchRoute);
app.use("/api/posts", postRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/categories", postscategoryRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// --- Start Server ---
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);