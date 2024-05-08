const express = require("express");
const path = require("path");
const Categories = require("../model/categories");
const router = express.Router();
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const fs = require("fs");
const bodyParser = require("body-parser");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

const jsonParser = bodyParser.json();

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

// Xóa danh mục
router.delete(
  "/delete-categories/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const categories = await Categories.findById(req.params.id);

      if (!categories) {
        return next(new ErrorHandler("Danh mục không tồn tại!", 400));
      }

      await Categories.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Xóa danh mục thành công!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Thêm danh mục con
router.put(
  "/update-subcategories/:id",
  isAuthenticated,
  isAdmin("Admin"),
  upload.single("imgSubCategories"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const categories = await Categories.findById(req.params.id);
      const filename = req.file.filename;
      const fileUrl = path.join(filename);

      let imgSubCategories = "";
      if (typeof req.body.imgSubCategories === "string") {
        images.push(req.body.imgSubCategories);
      } else {
        images = req.body.imgSubCategories;
      }
      req.body.imgSubCategories = fileUrl;

      const sameCategories = categories.subcategory.find(
        (category) =>
          category.titleSubCategories === req.body.titleSubCategories
      );
      if (sameCategories) {
        return next(
          new ErrorHandler(
            `${req.body.titleSubCategories} Danh mục đã tồn tại!`
          )
        );
      }

      const existsCategories = categories.subcategory.find(
        (category) => category._id === req.body._id
      );

      if (existsCategories) {
        Object.assign(existsCategories, req.body);
      } else {
        // add the new address to the array
        categories.subcategory.push(req.body);
      }

      await categories.save();
      res.status(200).json({
        success: true,
        categories,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Xóa danh mục con
router.delete(
  "/delete-subcategories/:id",

  catchAsyncErrors(async (req, res, next) => {
    try {
      const categoriesId = req.categories._id;
      // const categoriesId ='6639e61908ce99bf70171b0d';
      const subcategoriesId = req.params.id;

      await Categories.updateOne(
        {
          _id: categoriesId,
        },
        { $pull: { subcategory: { _id: subcategoriesId } } }
      );

      const categories = await Categories.findById(categoriesId);

      res.status(200).json({ success: true, categories });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// update status Fillter
router.put(
  "/update-status-filter/:id",
  // isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const filterID = "663afca2b84db4e70a1fc022";
    const {
      locationFilter,
      priceFilter,
      shipCodFilter,
      GuarPayFilter,
      statusFilter,
    } = req.body;

    try {
      const categories = await Categories.findOneAndUpdate(
        { _id: id, "filter._id": filterID },
        {
          $set: {
            "filter.$.locationFilter": locationFilter,
            "filter.$.priceFilter": priceFilter,
            "filter.$.shipCodFilter": shipCodFilter,
            "filter.$.GuarPayFilter": GuarPayFilter,
            "filter.$.statusFilter": statusFilter,
          },
        },
        { new: true } // Option này trả về document đã được update
      );
      res.status(200).json({ success: true, categories });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Tạo filter cho mỗi danh mục
router.put(
  "/create-subfilter/:id",
  isAuthenticated,

  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { itemIndex, categoriesFilter } = req.body;

    try {
      const categories = await Categories.findById(id);
      if (!categories) {
        return res.status(404).send("categories not found");
      }
      // Thêm subItem mới vào item tại index chỉ định
      categories.filter[itemIndex].categoriesFilter.push(categoriesFilter);
      await categories.save();
      res.send(categories);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Xóa filter cho danh mục
router.delete(
  "/delete-subfilter/:id",
  isAuthenticated,

  catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const filterID = "663b259eeec7c4811f25ee6f";
    const categoriesFilterId = "663b25cbeec7c4811f25ee74";

    try {
      const categories = await Categories.findById(id);
      if (!categories) {
        return res.status(404).send("categories not found");
      }
      const item = categories.filter.id(filterID);
      if (!item) {
        return res.status(404).send("Filter not found");
      }

      item.categoriesFilter.id(categoriesFilterId).deleteOne(); // Xóa sub item
      await categories.save(); // Lưu thay đổi vào database

      res.send(categories);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
