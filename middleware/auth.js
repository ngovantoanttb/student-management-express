const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        // Lấy token từ header
        const token = req.header("Authorization").replace("Bearer ", "");

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // console.log(decoded);

        // Thêm thông tin user vào request
        req.user = decoded.student;

        next();
    } catch (error) {
        res.status(401).json({ message: "Vui lòng đăng nhập" });
    }
};
