const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    brand:{
        type:String,
        required:true,
        trim:true
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    subCategory: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: String,
        required: true,
        trim:true
    },
    sizes: {
        type:[],
        required: true,
    },
    img: {
        type: String,
        required: true
    },
    cloudinaryId: {
        type: String,
        required: true
    },
    imgName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true,
    },
    color:{
        type:String,
        required:true
    },
    userReviews:{
        type:Array,
    },
    discount:{
        type:String,
        default:0
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }


},{timestamps:true})

module.exports = mongoose.model("product", productSchema)