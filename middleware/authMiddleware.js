const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const authMiddleware = async (req, res, next) => {
	try {
		// Lấy token từ header
		const token = req.headers.authorization?.split(' ')[1];

		if (!token) {
			return res
				.status(401)
				.json({ message: 'Không tìm thấy token xác thực' });
		}

		// Xác thực token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		console.log(decoded.student);

		// Tìm user từ database
		const user = await Student.findById(decoded.student.id).select(
			'-password'
		);

		if (!user) {
			return res.status(401).json({
				message: 'Token không hợp lệ hoặc người dùng không tồn tại',
			});
		}

		// Thêm thông tin user vào request
		req.user = user;
		next();
	} catch (error) {
		console.error('Lỗi xác thực:', error);
		return res
			.status(401)
			.json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
	}
};

module.exports = authMiddleware;
