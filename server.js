// Tải các môi trường cấu hình từ file .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Để sử dụng các path tĩnh nếu cần
const morgan = require('morgan'); // Thêm morgan để logging các request
const bodyParser = require('body-parser');
// Import các router
const studentRoutes = require('./routes/studentRoutes');
const forumRoutes = require('./routes/forumRoutes');

// Khởi tạo ứng dụng Express
const app = express();

// Middleware để ghi log các request (trong môi trường phát triển)
app.use(morgan('dev')); // Sử dụng morgan để log request trong môi trường phát triển
// CORS Middleware - cho phép các yêu cầu từ domain khác
app.use(
	cors({
		origin: '*', // Cho phép tất cả các domain
		methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức HTTP được phép
		allowedHeaders: ['Content-Type', 'Authorization'], // Các header được phép
	})
);
// Middleware để parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Để parse các form-urlencoded

// Tăng giới hạn kích thước cho body-parser
app.use(bodyParser.json({ limit: '50mb' })); // 50MB cho JSON
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // 50MB cho URL encoded

// Kết nối MongoDB
mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('Đã kết nối với MongoDB');
	})
	.catch((err) => {
		console.error('Lỗi kết nối MongoDB:', err);
	});

// Đăng ký các route
app.use('/api/dev/welcome', (req, res) => {
	res.json({ message: 'Welcome to the API' });
});

// Đăng ký các route chính của ứng dụng
app.use('/api/students', studentRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/uploads', express.static('uploads'));

// Middleware xử lý các lỗi không xác định hoặc lỗi xảy ra trong route
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ message: 'Đã xảy ra lỗi!', error: err.message });
});

// Middleware cho các routes tĩnh (ví dụ nếu có ảnh hoặc tài liệu cần phục vụ cho ứng dụng)
app.use(express.static(path.join(__dirname, 'public')));

// Lắng nghe server trên port chỉ định
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server đang chạy trên port ${PORT}`);
});
