const express = require("express");
const path = require("path");
const router = express.Router();
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const fs = require("fs");
const bodyParser = require("body-parser");
const News = require("../model/news");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Tạo danh mục
router.post(
    "/create-categories",
    isAuthenticated,
    isAdmin("Admin"),
    upload.single("imgCategories"),
    async (req, res, next) => {
      try {
        const { title } = req.body;
  
        let categories = await Categories.findOne({ title });
        if (categories) {
          const filename = req.file.filename;
          const filePath = `uploads/${filename}`;
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(err);
              res.status(500).json({ message: "Error deleting file" });
            }
          });
          return next(new ErrorHandler("Danh mục đã tồn tại", 400));
        }
        const filename = req.file.filename;
        const fileUrl = path.join(filename);
        categories = await Categories.create({
          title,
          imgCategories: fileUrl,
        });
  
        res.status(201).json({
          success: true,
          categories,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );
  

  module.exports = router;