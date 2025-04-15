const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Routes công khai
router.post("/register", studentController.register);
router.post("/login", studentController.login);

// Routes yêu cầu xác thực
router.get("/profile", auth, studentController.getProfile);
router.put("/profile", auth, studentController.updateProfile);

// Routes chỉ dành cho admin
router.get("/", auth, admin, studentController.getAllStudents);
router.post("/", auth, admin, studentController.createStudent);
router.get("/:id", auth, admin, studentController.getStudentById);
router.put("/:id", auth, admin, studentController.updateStudent);
router.delete("/:id", auth, admin, studentController.deleteStudent);

module.exports = router;
