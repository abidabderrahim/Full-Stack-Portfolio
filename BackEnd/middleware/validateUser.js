import validator from "validator";

// ------------------ REGISTER VALIDATION ------------------
export const validateRegister = (req, res, next) => {
  const fullName = req.body.fullName?.trim();
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

  if (!fullName || fullName.length < 3) {
    return res
      .status(400)
      .json({ success: false, message: "Full name must be at least 3 characters" });
  }

  if (!email || !validator.isEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid email address is required" });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password Too Weak",
    });
  }

  next();
};

// ------------------ LOGIN VALIDATION ------------------
export const validateLogin = (req, res, next) => {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }

  if (!validator.isEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid email address is required" });
  }

  next();
};

// ------------------ RESET PASSWORD VALIDATION ------------------
export const validateResetPassword = (req, res, next) => {
  const newPassword = req.body.newPassword?.trim();

  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: "Password must be at least 6 characters" });
  }

  next();
};