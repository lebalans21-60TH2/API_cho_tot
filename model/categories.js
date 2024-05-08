const mongoose = require("mongoose");


const categoriesFiltersSchema = new mongoose.Schema({
  titleFiterCategories: String
})

const filterCategoriesSchema = new mongoose.Schema({
  locationFilter: {
    type: Number,
   
  },
  categoriesFilter:[categoriesFiltersSchema],
  priceFilter: {
    type: Number,
   
  },
  shipCodFilter: {
    type: Number,
  
  },
  GuarPayFilter: {
    type: Number,
  
  },
  statusFilter: {
    type: Number,
  
  },
});

const categoriesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imgCategories: {
    type: String,
    reqiured: true,
  },
  subcategory: [
    {
      titleSubCategories: {
        type: String,
      },
      imgSubCategories: {
        type: String,
      },
    },
  ],
  filter: {
    type:[filterCategoriesSchema],
    default: [{ locationFilter: 1, priceFilter: 1,priceFilter:1,shipCodFilter:1,GuarPayFilter:1, statusFilter:1}]
  },
});

module.exports = mongoose.model("Categories", categoriesSchema);
