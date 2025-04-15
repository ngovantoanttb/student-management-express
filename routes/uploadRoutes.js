const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Import đúng cách

// Cấu hình Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình Multer để lưu ảnh vào Cloudinary
const storage = new CloudinaryStorage({
	cloudinary: cloudinary, // Cloudinary instance đã cấu hình
	params: {
		folder: 'comments', // Thư mục trên Cloudinary
		format: 'jpg', // Định dạng ảnh
		public_id: (req, file) => Date.now(), // Tạo ID duy nhất cho ảnh
	},
});

// Khởi tạo multer với Cloudinary storage
const upload = multer({
	storage: storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn kích thước file là 10MB
});

// API upload ảnh
router.post('/image', upload.single('image'), (req, res) => {
	// Kiểm tra xem ảnh có được tải lên không
	if (!req.file) {
		return res.status(400).json({ message: 'Không có ảnh được tải lên' });
	}

	// Lấy đường dẫn ảnh từ Cloudinary
	const imageUrl = req.file.path; // Cloudinary trả về URL an toàn của ảnh

	res.json({ url: imageUrl });
});

module.exports = router;
