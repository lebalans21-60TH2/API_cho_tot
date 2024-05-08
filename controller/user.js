const express = require("express");
const path = require("path");
const User = require("../model/user");
const router = express.Router();
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

const bodyParser = require("body-parser");

const jsonParser = bodyParser.json();

// đăng ký tài khoản người dùng
router.post("/create-user", async (req, res, next) => {
  try {
    const { name, phoneNumber, password } = req.body;
    // const userphoneNumber = await User.findOne({ phoneNumber });

    // if (userphoneNumber) {
    //   const filename = req.file.filename;
    //   const filePath = `uploads/${filename}`;
    //   fs.unlink(filePath, (err) => {
    //     if (err) {
    //       console.log(err);
    //       res.status(500).json({ message: "Error deleting file" });
    //     }
    //   });
    //   return next(new ErrorHandler("Người dùng đã tồn tại", 400));
    // }

    // const filename = req.file.filename;
    // const fileUrl = path.join(filename);

    // const user = {
    //   name: name,
    //   phoneNumber: phoneNumber,
    //   password: password,
    //    avatar: fileUrl,
    // };
    // const { name, phoneNumber, password, avatar } = newUser;

    let user = await User.findOne({ phoneNumber });

    if (user) {
      return next(new ErrorHandler("Người dùng đã tồn tại!", 400));
    }
    user = await User.create({
      name,
      phoneNumber,

      password,
    });

    sendToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// đăng nhập tài khoản
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { phoneNumber, password } = req.body;

      if (!phoneNumber || !password) {
        return next(
          new ErrorHandler("Vui lòng cung cấp tất cả thông tin!", 400)
        );
      }

      const user = await User.findOne({ phoneNumber }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Người dùng không tồn tại!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Số điện thoại hoặc mật khẩu không đúng!", 400)
        );
      }

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// lấy thông tin người dùng
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("Người dùng không tồn tại!", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// đăng xuất tài khoản
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });
      res.status(201).json({
        success: true,
        message: "Đăng xuất thành công!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Cập nhật thông tin tài khoản

router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { phoneNumber, password, name } = req.body;

      const user = await User.findOne({ phoneNumber }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Không tìm thấy người dùng này!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Vui lòng cung cấp thông tin chính xác!", 400)
        );
      }
 
      user.name = name;
      user.phoneNumber = phoneNumber;
      user.password = password;

      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// tìm kiếm tài khoản bằng id của user --admin
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Chức năng cho admin
// Lấy tất cả tài khoản ---admin
// all users --- for admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find();
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//Xóa tài khoản --admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("Không có người dùng khớp với id này!", 400)
        );
      }

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Xóa người dùng thành công!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);





// update user info
// router.put(
//   "/update-user-info",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { phoneNumber, password, phoneNumber, name } = req.body;

//       const user = await User.findOne({ phoneNumber }).select("+password");

//       if (!user) {
//         return next(new ErrorHandler("Không tìm thấy người dùng này!", 400));
//       }

//       const isPasswordValid = await user.comparePassword(password);

//       if (!isPasswordValid) {
//         return next(
//           new ErrorHandler("Vui lòng cung cấp thông tin chính xác!", 400)
//         );
//       }

//       user.name = name;
//       user.phoneNumber = phoneNumber;
//       user.phoneNumber = phoneNumber;

//       await user.save();

//       res.status(201).json({
//         success: true,
//         user,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// update user avatar
// router.put(
//   "/update-avatar",
//   isAuthenticated,
//   upload.single("image"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const existsUser = await User.findById(req.user.id);

//       const existAvatarPath = `uploads/${existsUser.avatar}`;

//       fs.unlinkSync(existAvatarPath);

//       const fileUrl = path.join(req.file.filename);

//       const user = await User.findByIdAndUpdate(req.user.id, {
//         avatar: fileUrl,
//       });

//       res.status(200).json({
//         success: true,
//         user,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// update user addresses
// router.put(
//   "/update-user-addresses",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const user = await User.findById(req.user.id);

//       const sameTypeAddress = user.addresses.find(
//         (address) => address.addressType === req.body.addressType
//       );
//       if (sameTypeAddress) {
//         return next(
//           new ErrorHandler(`${req.body.addressType} địa chỉ đã tồn tại!`)
//         );
//       }

//       const existsAddress = user.addresses.find(
//         (address) => address._id === req.body._id
//       );

//       if (existsAddress) {
//         Object.assign(existsAddress, req.body);
//       } else {
//         // add the new address to the array
//         user.addresses.push(req.body);
//       }

//       await user.save();

//       res.status(200).json({
//         success: true,
//         user,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// delete user address
// router.delete(
//   "/delete-user-address/:id",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const userId = req.user._id;
//       const addressId = req.params.id;

//       console.log(addressId);

//       await User.updateOne(
//         {
//           _id: userId,
//         },
//         { $pull: { addresses: { _id: addressId } } }
//       );

//       const user = await User.findById(userId);

//       res.status(200).json({ success: true, user });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// update user password
// router.put(
//   "/update-user-password",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const user = await User.findById(req.user.id).select("+password");

//       const isPasswordMatched = await user.comparePassword(
//         req.body.oldPassword
//       );

//       if (!isPasswordMatched) {
//         return next(new ErrorHandler("Mật khẩu cũ không đúng!", 400));
//       }

//       if (req.body.newPassword !== req.body.confirmPassword) {
//         return next(
//           new ErrorHandler("Mật khẩu không khớp với nhau!", 400)
//         );
//       }
//       user.password = req.body.newPassword;

//       await user.save();

//       res.status(200).json({
//         success: true,
//         message: "Cập nhật mật khẩu thành công!",
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// find user infoormation with the userId
// router.get(
//   "/user-info/:id",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const user = await User.findById(req.params.id);

//       res.status(201).json({
//         success: true,
//         user,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// all users --- for admin
// router.get(
//   "/admin-all-users",
//   isAuthenticated,
//   isAdmin("Admin"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const users = await User.find().sort({
//         createdAt: -1,
//       });
//       res.status(201).json({
//         success: true,
//         users,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// delete users --- admin
// router.delete(
//   "/delete-user/:id",
//   isAuthenticated,
//   isAdmin("Admin"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const user = await User.findById(req.params.id);

//       if (!user) {
//         return next(
//           new ErrorHandler("Người dùng không khả dụng với id này!", 400)
//         );
//       }

//       await User.findByIdAndDelete(req.params.id);

//       res.status(201).json({
//         success: true,
//         message: "Xóa người dùng thành công!",
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

module.exports = router;
