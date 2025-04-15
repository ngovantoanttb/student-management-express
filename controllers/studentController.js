const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Đăng ký tài khoản sinh viên
exports.register = async (req, res) => {
	try {
		const { password, fullname, email, studentId } = req.body;
		console.log(password, fullname, email, studentId);
		// Kiểm tra xem username hoặc email đã tồn tại chưa
		const existingStudent = await Student.findOne({
			$or: [{ email }, { studentId }],
		});

		if (existingStudent) {
			return res.status(400).json({
				message: 'Username, email hoặc mã sinh viên đã tồn tại',
			});
		}

		// Mã hóa mật khẩu
		const hashedPassword = await bcrypt.hash(password, 10);

		// Tạo sinh viên mới
		const student = new Student({
			password: hashedPassword,
			fullname,
			email,
			studentId,
		});

		await student.save();
		res.status(201).json({ message: 'Đăng ký thành công' });
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Đăng nhập
exports.login = async (req, res) => {
	try {
		const { username, password } = req.body;

		// Tìm sinh viên theo username
		const student = await Student.findOne({ username });
		if (!student) {
			return res
				.status(401)
				.json({ message: 'Thông tin đăng nhập không chính xác' });
		}

		// Kiểm tra mật khẩu
		const isValidPassword = await bcrypt.compare(
			password,
			student.password
		);
		if (!isValidPassword) {
			return res
				.status(401)
				.json({ message: 'Thông tin đăng nhập không chính xác' });
		}

		// Tạo JWT token
		const token = jwt.sign(
			{ id: student._id, role: student.role },
			process.env.JWT_SECRET,
			{ expiresIn: '1d' }
		);

		res.json({
			token,
			student: {
				id: student._id,
				username: student.username,
				fullname: student.fullname,
				role: student.role,
			},
		});
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Lấy thông tin profile của sinh viên đang đăng nhập
exports.getProfile = async (req, res) => {
	try {
		const student = await Student.findById(req.user.id).select('-password');
		if (!student) {
			return res
				.status(404)
				.json({ message: 'Không tìm thấy sinh viên' });
		}
		res.json(student);
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Cập nhật profile của sinh viên đang đăng nhập
exports.updateProfile = async (req, res) => {
	try {
		console.log('1. Request body:', req.body);
		const { fullname, email, password, birthDate, address } = req.body;
		const user = req.user; // Lấy từ middleware auth

		console.log('1. User from middleware:', user);
		// Kiểm tra các trường bắt buộc
		console.log(fullname, email, password, birthDate, address);

		console.log('2. Parsed data:', {
			fullname,
			email,
			password,
			birthDate,
			address,
		});
		console.log('3. User from middleware:', user);

		const student = await Student.findById(user.id);
		console.log('4. Found student:', student);

		if (!student) {
			console.log('5. Student not found');
			return res
				.status(404)
				.json({ message: 'Không tìm thấy sinh viên' });
		}

		// Kiểm tra email đã tồn tại chưa (trừ email hiện tại của user)
		const existingStudent = await Student.findOne({
			email,
			_id: { $ne: student._id },
		});
		console.log('6. Existing student check:', existingStudent);

		if (existingStudent) {
			console.log('7. Email already exists');
			return res.status(400).json({
				message: 'Email đã tồn tại',
			});
		}

		// Mã hóa mật khẩu nếu có
		let hashedPassword;
		if (password) {
			console.log('8. Hashing new password');
			hashedPassword = await bcrypt.hash(password, 10);
			console.log('9. Password hashed successfully');
		}

		// Cập nhật thông tin sinh viên
		student.fullname = fullname || student.fullname;
		student.email = email || student.email;
		student.password = hashedPassword || student.password;
		student.birthDate = birthDate || student.birthDate;
		student.address = address || student.address;

		console.log('10. Updating student with:', {
			fullname: student.fullname,
			email: student.email,
			passwordChanged: !!hashedPassword,
			birthDate: student.birthDate,
			address: student.address,
		});

		await student.save();
		console.log('11. Student updated successfully');

		// Trả về thông tin đã cập nhật (không bao gồm password)
		const updatedStudent = {
			_id: student._id,
			fullname: student.fullname,
			email: student.email,
			studentId: student.studentId,
			role: student.role,
			birthDate: student.birthDate,
			address: student.address,
		};

		console.log('12. Sending response:', updatedStudent);
		res.json(updatedStudent);
	} catch (error) {
		console.error('ERROR in updateProfile:', error);
		console.error('Error stack:', error.stack);
		res.status(500).json({
			message: 'Lỗi server',
			error: error.message,
			stack: error.stack,
		});
	}
};

// Lấy danh sách sinh viên (chỉ admin)
exports.getAllStudents = async (req, res) => {
	console.log('here');
	try {
		const students = await Student.find({}, '-password');
		res.json(students);
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Thêm mới một sinh viên (chỉ admin)
exports.createStudent = async (req, res) => {
	try {
		console.log('Request body:', req.body);
		const {
			password,
			fullname,
			email,
			studentId,
			role,
			address,
			birthDate,
		} = req.body;

		if (!password || !fullname || !email || !studentId) {
			console.log('Missing required fields');
			return res.status(400).json({
				message: 'Vui lòng điền đầy đủ thông tin',
			});
		}

		// Kiểm tra xem email hoặc mã sinh viên đã tồn tại chưa
		const existingStudent = await Student.findOne({
			$or: [{ email }, { studentId }],
		});

		if (existingStudent) {
			console.log('Student already exists:', { email, studentId });
			return res.status(400).json({
				message: 'Email hoặc mã sinh viên đã tồn tại',
			});
		}

		// Mã hóa mật khẩu
		const hashedPassword = await bcrypt.hash(password, 10);

		const student = new Student({
			fullname,
			email,
			studentId,
			password: hashedPassword,
			role: role || 'student',
			address: address || '',
			birthDate: birthDate || null,
		});

		console.log('Saving student:', {
			fullname,
			email,
			studentId,
			role: role || 'student',
		});

		await student.save();
		res.status(201).json(student);
	} catch (error) {
		console.error('Error in createStudent:', error);
		console.error('Stack trace:', error.stack);
		res.status(500).json({
			message: 'Lỗi server',
			error: error.message,
			stack: error.stack,
		});
	}
};

// Lấy chi tiết 1 sinh viên (chỉ admin)
exports.getStudentById = async (req, res) => {
	try {
		const student = await Student.findById(req.params.id).select(
			'-password'
		);
		if (!student) {
			return res
				.status(404)
				.json({ message: 'Không tìm thấy sinh viên' });
		}
		res.json(student);
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Cập nhật thông tin sinh viên (chỉ admin)
exports.updateStudent = async (req, res) => {
	try {
		console.log('1. Request body:', req.body);
		const {
			fullname,
			email,
			studentId,
			role,
			birthDate,
			address,
			password,
		} = req.body;

		// Tìm sinh viên cần cập nhật
		const student = await Student.findById(req.params.id);
		if (!student) {
			return res
				.status(404)
				.json({ message: 'Không tìm thấy sinh viên' });
		}

		// Kiểm tra email đã tồn tại chưa (trừ email hiện tại)
		const existingStudent = await Student.findOne({
			email,
			_id: { $ne: student._id },
		});

		if (existingStudent) {
			return res.status(400).json({ message: 'Email đã tồn tại' });
		}

		// Mã hóa mật khẩu nếu có
		let hashedPassword;
		if (password) {
			hashedPassword = await bcrypt.hash(password, 10);
		}

		// Cập nhật thông tin
		student.fullname = fullname;
		student.email = email;
		student.studentId = studentId;
		student.role = role;
		student.birthDate = birthDate || student.birthDate;
		student.address = address || student.address;
		if (hashedPassword) {
			student.password = hashedPassword;
		}

		await student.save();

		// Trả về thông tin đã cập nhật (không bao gồm password)
		const updatedStudent = {
			_id: student._id,
			fullname: student.fullname,
			email: student.email,
			studentId: student.studentId,
			role: student.role,
			birthDate: student.birthDate,
			address: student.address,
		};

		res.json(updatedStudent);
	} catch (error) {
		console.error('ERROR in updateStudent:', error);
		res.status(500).json({
			message: 'Lỗi server',
			error: error.message,
		});
	}
};

// Xóa sinh viên (chỉ admin)
exports.deleteStudent = async (req, res) => {
	try {
		const student = await Student.findByIdAndDelete(req.params.id);

		if (!student) {
			return res
				.status(404)
				.json({ message: 'Không tìm thấy sinh viên' });
		}

		res.json({ message: 'Xóa sinh viên thành công' });
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};
