const express = require("express");
const { signup, login, getProfile, listUsers,deleteUser } = require("../controllers/authController");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const router = express.Router();

// Debug to confirm imports
console.log("Loaded authController exports:", {
  signup,
  login,
  getProfile,
  listUsers,
  deleteUser
});

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", auth, getProfile); // protected profile route
router.get("/users", auth, isAdmin, listUsers); // protected admin route
router.delete("/users/:id", auth, isAdmin, deleteUser); // protected admin route

module.exports = router;
