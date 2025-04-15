const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    studentId: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ["student", "admin"],
        default: "student",
    },
    avatar: {
        type: String,
        default: "default-avatar.png",
    },
    phone: {
        type: String,
        default: "",
    },
    address: {
        type: String,
        required: false,
    },
    birthDate: {
        type: Date,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

// Không trả về password khi convert sang JSON
studentSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model("Student", studentSchema);
