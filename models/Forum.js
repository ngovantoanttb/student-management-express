const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Student',
		required: true,
	},
	category: {
		type: String,
		enum: ['general', 'academic', 'events', 'questions'],
		default: 'general',
	},
	type: {
		type: String,
		enum: ['post', 'question', 'event'],
		default: 'post',
	},
	likes: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
		},
	],
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Comment',
		},
	],
	status: {
		type: String,
		enum: ['active', 'inactive', 'spending'],
		default: 'spending',
	},
	thumbnail: {
		type: String,
		default: null,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Cập nhật thời gian sửa đổi trước khi lưu
forumPostSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

module.exports = mongoose.model('ForumPost', forumPostSchema);
