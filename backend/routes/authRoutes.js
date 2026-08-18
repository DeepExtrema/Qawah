const express = require("express");
// bcryptjs, not bcrypt: the native module compiles to a platform-specific
// .node binary that esbuild cannot bundle into a Netlify Function, so the
// deployed API crashed on import. bcryptjs is pure JavaScript, uses the same
// algorithm, and verifies existing $2b$ hashes, so no password had to change.
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const {
  emailIssue,
  nameIssue,
  passwordIssue,
  rejectFields,
} = require("../utils/validate");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};

    const fields = {};
    const nameProblem = nameIssue(name, "name this account should be under");
    if (nameProblem) fields.name = nameProblem;

    const emailProblem = emailIssue(email);
    if (emailProblem) fields.email = emailProblem;

    // Name and email go in as context so "taimoor2024" is rejected for an
    // account belonging to Taimoor, which is the guess an attacker makes first.
    const passwordProblem = passwordIssue(password, { email, name });
    if (passwordProblem) fields.password = passwordProblem;

    rejectFields(fields);

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const taken = "An account with this email already exists.";
      throw new AppError(taken, 409, "EMAIL_TAKEN", { email: taken });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    const token = signToken(user);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: publicUser(user),
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    // Presence only. Running the full format rules here would reject an old
    // account whose address predates them, and lock somebody out of their own
    // orders over a rule that only ever applied at signup.
    const fields = {};
    if (!String(email || "").trim()) fields.email = "Please add your email address.";
    if (!String(password || "")) fields.password = "Please add your password.";
    rejectFields(fields);

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    // Deliberately identical for an unknown address and a wrong password, and
    // deliberately not keyed to a field. Saying which half was wrong turns this
    // form into a way to test whether an address has an account here.
    const invalid = () =>
      new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");

    if (!user) throw invalid();

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) throw invalid();

    const token = signToken(user);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  })
);

router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");
    res.status(200).json(user);
  })
);

router.put(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    const { name, email } = req.body || {};

    const fields = {};
    const nameProblem = nameIssue(name, "name on this account");
    if (nameProblem) fields.name = nameProblem;

    const emailProblem = emailIssue(email);
    if (emailProblem) fields.email = emailProblem;

    rejectFields(fields);

    const cleanEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({
      email: cleanEmail,
      _id: { $ne: req.user.userId },
    });
    if (existingUser) {
      const taken = "That email is already being used by another account.";
      throw new AppError(taken, 409, "EMAIL_TAKEN", { email: taken });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name: String(name).trim(), email: cleanEmail },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) throw new AppError("User not found.", 404, "NOT_FOUND");

    res.status(200).json({
      message: "Profile updated successfully.",
      user,
    });
  })
);

module.exports = router;
