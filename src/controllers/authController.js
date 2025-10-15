const User = require("../models/User");
const jwt = require("jsonwebtoken");
const client = require("prom-client");


// =============================
// Prometheus Custom Metrics
// =============================
const signupCounter = new client.Counter({
  name: "volkrin_signups_total",
  help: "Total number of user signups",
});

const loginCounter = new client.Counter({
  name: "volkrin_logins_total",
  help: "Total number of successful logins",
});

const failedLoginCounter = new client.Counter({
  name: "volkrin_failed_logins_total",
  help: "Total number of failed login attempts",
});

const userDeleteCounter = new client.Counter({
  name: "volkrin_user_deletions_total",
  help: "Total number of user deletions",
});


// =============================
// Generate JWT with id + role
// =============================
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// =============================
// POST /signup
// =============================
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, adminSecret } = req.body;

    console.log("Signup attempt:", {
      email,
      requestedRole: role,
      providedSecret: adminSecret,
      expectedSecret: process.env.ADMIN_SECRET ? "SET" : "MISSING"
    });

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Default role is always "user"
    let userRole = "user";

    // Only grant admin if BOTH conditions are met:
    // 1. Client explicitly requested role "admin"
    // 2. Provided secret matches exactly the ADMIN_SECRET in .env
    if (role === "admin" && adminSecret && adminSecret === process.env.ADMIN_SECRET) {
      console.log("✅ Admin secret matched — creating admin user");
      userRole = "admin";
    } else if (role === "admin") {
      console.warn("❌ Invalid or missing adminSecret — forcing role=user");
    }

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    // ✅ Increment signup counter
    signupCounter.inc();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: error.message });
  }
};


// =============================
// POST /login
// =============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      // ✅ Increment login counter
      loginCounter.inc();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      // ❌ Increment failed login counter
      failedLoginCounter.inc();

      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =============================
// GET /me (profile)
// =============================
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ message: error.message });
  }
};
// =============================
// GET /users (Admin Only)
// =============================
exports.listUsers = async (req, res) => {
  try {
    // Only admins should reach here (protected by isAdmin middleware)
    const users = await User.find().select("-password"); // never return password hashes
    res.json(users);
  } catch (error) {
    console.error("List Users Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =============================
// DELETE /users/:id (Admin Only)
// =============================
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: "Admins cannot delete themselves" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
    // ✅ Increment user deletion counter
    userDeleteCounter.inc();
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: error.message });
  }
};


