const express = require("express");
const path = require("path");
const Banner = require("../model/banner");
const { upload } = require("../multer");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Create banner
router.post("/create-banner", upload.single("bannerImage"), async (req, res, next) => {
    try {
     
      const filename = req.file.filename;
      const fileUrl = path.join(filename);
     
      const banner = await Banner.create({
        bannerImage: fileUrl
      });

      res.status(201).json({
        success: true,
        banner,
      });

    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  });

//   get all banner
router.get("/get-all-banner",
catchAsyncErrors(async (req, res, next) => {
    try {
      const banners = await Banner.find().then((banners) => {
        res.status(201).json({
            success: true,
            banners,
          });
      });
      
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }))

//   delete banner
router.delete("/delete-banner/:id",
catchAsyncErrors(async (req, res, next) => {
    try {
      const banner = await Banner.findById(req.params.id);

      if (!banner) {
        return next(
          new ErrorHandler("Hình ảnh banner này không tồn tại!", 400)
        );
      }

      await Banner.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Xóa hình ảnh thành công!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
)

  module.exports = router;