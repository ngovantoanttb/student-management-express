const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Import đúng cách

// Cấu hình Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Sử dụng CloudinaryStorage
const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: 'thumbnails', // Thư mục trên Cloudinary
		format: 'jpg', // Định dạng ảnh
		public_id: (req, file) => Date.now(), // Tạo ID duy nhất cho ảnh
	},
});

// Khởi tạo multer với cấu hình Cloudinary storage
const upload = multer({
	storage: storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn kích thước file là 10MB
});

// Routes công khai
router.get('/', forumController.getPosts);
router.get('/:id', forumController.getPost);

// Routes yêu cầu xác thực
router.use(authMiddleware);

// Route POST để tạo bài viết
router.post('/', upload.single('thumbnail'), forumController.createPost);

// Like/Unlike bài viết
router.post('/:id/like', forumController.toggleLike);

// Thêm comment
router.post('/:id/comments', forumController.addComment);

// Xóa bài viết
router.delete('/:id', forumController.deletePost);

// Xóa comment
router.delete('/:postId/comments/:commentId', forumController.deleteComment);

// Lấy bài viết chưa duyệt
router.get('/unapproved/all', forumController.getPendingPosts);

// Duyệt bài viết
router.post('/approve/:id', forumController.approvePost);

// Hủy duyệt bài viết
router.post('/reject/:id', forumController.rejectPost);

module.exports = router;
