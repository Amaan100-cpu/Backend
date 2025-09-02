const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        required:true,
        unique:true

    },
    password: {
        type: String
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    otp:{
        type:String,
        default:""
    },
    clickAuth:{
        type:Boolean,
        default:false
    },
    otpExpire:Number,
    reset:{
        type:Boolean,
        default:false
    },
    tempPassword:String
    
})

module.exports=mongoose.model("user",userSchema)