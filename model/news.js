const mongoose = require("mongoose");

const keywordSchema = new mongoose.Schema({
  title: String,
});

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imageBanner: {
    type: String,
    required: true,
  },
  categories: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxLength: [200, "Mô tả ngắn không được vượt quá 200 kí tự"],
  },
  author: {
    type: Object,
    required: true,
  },
  keyword: [keywordSchema],
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("News", newsSchema);