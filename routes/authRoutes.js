const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Đăng ký tài khoản mới
// @access  Public
router.post('/register', async (req, res) => {
	try {
		const { fullname, email, password, studentId } = req.body;

		// Kiểm tra email đã tồn tại
		let student = await Student.findOne({ email });
		if (student) {
			return res.status(400).json({ message: 'Email đã được sử dụng' });
		}

		// Kiểm tra mã số sinh viên đã tồn tại
		student = await Student.findOne({ studentId });
		if (student) {
			return res
				.status(400)
				.json({ message: 'Mã số sinh viên đã tồn tại' });
		}

		// Tạo student mới
		student = new Student({
			fullname,
			email,
			password,
			studentId,
			role: 'student', // Mặc định là student
		});

		// Hash mật khẩu
		const salt = await bcrypt.genSalt(10);
		student.password = await bcrypt.hash(password, salt);

		// Lưu vào database
		await student.save();

		// Tạo JWT token
		const payload = {
			student: {
				id: student.id,
				role: student.role,
			},
		};

		jwt.sign(
			payload,
			process.env.JWT_SECRET,
			{ expiresIn: '24h' },
			(err, token) => {
				if (err) throw err;
				res.json({ token });
			}
		);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: 'Lỗi server' });
	}
});

// @route   POST api/auth/login
// @desc    Đăng nhập và lấy token
// @access  Public
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		// Kiểm tra email tồn tại
		const student = await Student.findOne({ email });
		if (!student) {
			return res
				.status(400)
				.json({ message: 'Thông tin đăng nhập không chính xác' });
		}

		// Kiểm tra mật khẩu
		const isMatch = await bcrypt.compare(password, student.password);
		if (!isMatch) {
			return res
				.status(400)
				.json({ message: 'Thông tin đăng nhập không chính xác' });
		}

		// Tạo JWT token
		const payload = {
			student: {
				id: student.id,
				role: student.role,
			},
		};

		jwt.sign(
			payload,
			process.env.JWT_SECRET,
			{ expiresIn: '24h' },
			(err, token) => {
				if (err) throw err;
				res.json({
					token,
					student: {
						id: student.id,
						fullname: student.fullname,
						email: student.email,
						studentId: student.studentId,
						role: student.role,
					},
				});
			}
		);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: 'Lỗi server' });
	}
});

// @route   GET api/auth/me
// @desc    Lấy thông tin user hiện tại
// @access  Private
router.get('/me', auth, async (req, res) => {
	try {
		const student = await Student.findById(req.student.id).select(
			'-password'
		);
		res.json(student);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: 'Lỗi server' });
	}
});

// @route   PUT api/auth/change-password
// @desc    Đổi mật khẩu
// @access  Private
router.put('/change-password', auth, async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		// Lấy thông tin student
		const student = await Student.findById(req.student.id);

		// Kiểm tra mật khẩu hiện tại
		const isMatch = await bcrypt.compare(currentPassword, student.password);
		if (!isMatch) {
			return res
				.status(400)
				.json({ message: 'Mật khẩu hiện tại không chính xác' });
		}

		// Hash mật khẩu mới
		const salt = await bcrypt.genSalt(10);
		student.password = await bcrypt.hash(newPassword, salt);

		// Lưu vào database
		await student.save();

		res.json({ message: 'Đổi mật khẩu thành công' });
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: 'Lỗi server' });
	}
});

module.exports = router;
