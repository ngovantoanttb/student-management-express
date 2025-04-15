const ForumPost = require('../models/Forum');
const Comment = require('../models/Comment');
const cloudinary = require('cloudinary').v2;

exports.createPost = async (req, res) => {
	try {
		const { title, content, category, author } = req.body;
		console.log(title, content, category, author);

		console.log(JSON.parse(author, null, 2));

		let thumbnailUrl = '';

		// Kiểm tra nếu có file ảnh thumbnail
		if (req.file) {
			// Upload ảnh lên Cloudinary
			const result = await cloudinary.uploader.upload(req.file.path, {
				folder: 'thumbnails', // Thư mục trên Cloudinary để lưu ảnh
				public_id: Date.now(), // Tạo ID duy nhất cho ảnh
				resource_type: 'image', // Chỉ định loại tài nguyên là hình ảnh
			});

			// Lưu URL của ảnh Cloudinary
			thumbnailUrl = result.secure_url; // URL an toàn từ Cloudinary
			console.log(thumbnailUrl);
		}

		// Tạo bài viết mới
		const post = new ForumPost({
			title,
			content,
			author: JSON.parse(author).id,
			category: category || 'general',
			status: 'spending',
			thumbnail: thumbnailUrl, // Lưu URL của ảnh thumbnail
		});

		// Lưu bài viết vào database
		await post.save();

		// Populate thông tin author trước khi trả về
		await post.populate('author', 'fullname');

		res.status(201).json(post); // Trả về bài viết đã được tạo
	} catch (error) {
		console.error('Lỗi khi tạo bài viết:', error);
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Lấy danh sách bài viết
exports.getPosts = async (req, res) => {
	try {
		const posts = await ForumPost.find({
			status: 'active',
		})
			.populate('author', 'fullname studentId')
			.populate({
				path: 'comments',
				populate: {
					path: 'author',
					select: 'fullname studentId',
				},
			})
			.sort({ createdAt: -1 });

		// Thêm thông tin về like cho mỗi bài viết
		const userId = req.user ? req.user._id : null;
		const postsWithLikeInfo = posts.map((post) => {
			const postObj = post.toObject();
			postObj.isLiked = userId ? post.likes.includes(userId) : false;
			return postObj;
		});

		res.json(postsWithLikeInfo);
	} catch (error) {
		console.error('Lỗi khi lấy danh sách bài viết:', error);
		res.status(500).json({ message: 'Lỗi khi lấy danh sách bài viết' });
	}
};

// Lấy chi tiết bài viết
exports.getPost = async (req, res) => {
	try {
		console.log(req.params.id);
		const post = await ForumPost.findById(req.params.id)

			.populate('author', 'fullname')
			.populate({
				path: 'comments',
				populate: {
					path: 'author',
					select: 'fullname',
				},
			});

		if (!post) {
			return res.status(404).json({ message: 'Không tìm thấy bài viết' });
		}

		res.json(post);
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Thêm bình luận
exports.addComment = async (req, res) => {
	try {
		const { content, author } = req.body;
		const postId = req.params.id;

		console.log(content, author, postId);

		const post = await ForumPost.findById(postId);
		if (!post) {
			return res.status(404).json({ message: 'Không tìm thấy bài viết' });
		}

		const comment = new Comment({
			content,
			author: author.id,
			post: postId,
		});

		await comment.save();

		post.comments.push(comment._id);
		await post.save();

		await comment.populate('author', 'fullname');

		res.status(201).json(comment);
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Xóa bài viết
exports.deletePost = async (req, res) => {
	try {
		const post = await ForumPost.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ message: 'Không tìm thấy bài viết' });
		}

		// Kiểm tra quyền xóa (chỉ tác giả hoặc admin)
		if (
			post.author.toString() !== req.user.id &&
			req.user.role !== 'admin'
		) {
			return res
				.status(403)
				.json({ message: 'Không có quyền xóa bài viết này' });
		}

		// Xóa tất cả comment của bài viết
		await Comment.deleteMany({ post: req.params.id });

		await post.deleteOne();
		res.json({ message: 'Xóa bài viết thành công' });
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Like/Unlike bài viết
exports.toggleLike = async (req, res) => {
	try {
		const postId = req.params.id;
		const userId = req.user.id;

		const post = await ForumPost.findById(postId);
		if (!post) {
			return res.status(404).json({ message: 'Không tìm thấy bài viết' });
		}

		const likeIndex = post.likes.indexOf(userId);
		if (likeIndex === -1) {
			// Chưa like -> thêm like
			post.likes.push(userId);
		} else {
			// Đã like -> bỏ like
			post.likes.splice(likeIndex, 1);
		}

		await post.save();
		res.json({ likes: post.likes.length, isLiked: likeIndex === -1 });
	} catch (error) {
		console.error('ERROR in toggleLike:', error);
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Xóa bình luận
exports.deleteComment = async (req, res) => {
	const { postId, commentId } = req.params;
	try {
		const post = await ForumPost.findById(postId);
		if (!post) {
			return res.status(404).json({ message: 'Không tìm thấy bài viết' });
		}

		const comment = await Comment.findById(commentId);
		if (!comment) {
			return res
				.status(404)
				.json({ message: 'Không tìm thấy bình luận' });
		}

		// Kiểm tra quyền xóa (chỉ tác giả hoặc admin)
		if (
			comment.author.toString() !== req.user.id &&
			req.user.role !== 'admin'
		) {
			return res
				.status(403)
				.json({ message: 'Không có quyền xóa bình luận này' });
		}

		await comment.deleteOne();

		// Xóa ID bình luận khỏi bài viết
		post.comments.pull(commentId);
		await post.save();

		res.json({ message: 'Xóa bình luận thành công' });
	} catch (error) {
		res.status(500).json({ message: 'Lỗi server', error: error.message });
	}
};

// Lấy dang sách bài viết chưa được duyệt
exports.getPendingPosts = async (req, res) => {
	try {
		const posts = await ForumPost.find({
			status: 'spending',
		}).populate('author', 'fullname studentId');

		res.json(posts);
	} catch (error) {
		console.error('Lỗi khi lấy danh sách bài viết chưa được duyệt:', error);
		res.status(500).json({
			message: 'Lỗi khi lấy danh sách bài viết chưa được duyệt',
		});
	}
};

// Duyệt bài viết
exports.approvePost = async (req, res) => {
	try {
		const postId = req.params.id;

		const post = await ForumPost.findById(postId);
		if (!post) {
			return res.status(404).json({ message: 'Không tìm thấy bài viết' });
		}

		post.status = 'active';
		await post.save();

		res.json({ message: 'Duyệt bài viết thành công' });
	} catch (error) {
		console.error('Lỗi khi duyệt bài viết:', error);
		res.status(500).json({ message: 'Lỗi khi duyệt bài viết' });
	}
};

// Hủy duyệt bài viết
exports.rejectPost = async (req, res) => {
	try {
		const postId = req.params.id;

		const post = await ForumPost.findById(postId);
		if (!post) {
			return res.status(404).json({ message: 'Không tìm thấy bài viết' });
		}

		post.status = 'inactive';
		await post.save();

		res.json({ message: 'Hủy duyệt bài viết thành công' });
	} catch (error) {
		console.error('Lỗi khi hủy duyệt bài viết:', error);
		res.status(500).json({ message: 'Lỗi khi hủy duyệt bài viết' });
	}
};
