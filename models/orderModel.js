const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
    },
    orderPrice: {
        type: String,
        required: true,
    },
    orderMethod: {
        type: String,
        required: true,
    },
    orderStatus: {
        type: String,
        required: true,
    },
    paymentStatus: {
        type: String,
        required: true,
    },
    orderDetails: {
        type: Array,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }


},{timestamps:true})

module.exports = mongoose.model("orders", orderSchema)