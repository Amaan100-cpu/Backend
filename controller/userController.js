const { registerVal, loginVal,AdminLoginVal } = require("../validation/userVal.js")
const userModel = require("../models/userModel.js")
const productModel = require("../models/productModel.js")
const orderModel = require("../models/orderModel.js")
const bcrypt = require("bcrypt")
const { sendEmail, otpGenrate } = require("../utils.js")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const fs = require("fs")
const Razorpay=require("razorpay")
const crypto=require("crypto")

function capitalizeFirstWord(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


const registerPost = async (req, res) => {
    try {
        const { name, email, password } = req.body
        const result = registerVal.safeParse({ name, email, password })
        const emailAlready = await userModel.findOne({ email })
        if (!(name && email && password)) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }
        else if (emailAlready?.isVerified) {
            return res.status(400).json({ success: false, message: "This email is already exist" })
        }
        else if (!result.success) {
            return res.status(400).json({ success: false, message: result.error.issues[0].message })
        }
        else if (emailAlready?.clickAuth) {
            const { name, email, password } = result.data
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(password, salt)
            const otp = otpGenrate()
            const userData = await userModel.updateOne({ email }, { name:capitalizeFirstWord(name), email, password: hash, otp, otpExpire: (Date.now() + 10 * 60 * 1000), reset: false })
            const message = `<h1>Your OTP is ${otp}</h1><p>This code is valid for 10 minutes.</p>`;
            sendEmail(email, message)
            res.cookie("email", email, { maxAge: 10 * 60 * 1000, httpOnly: true,secure: true,sameSite: "None" });
            return res.status(200).json({ success: true, message: "Please verify your email." })
        }
        else {
            const { name, email, password } = result.data
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(password, salt)
            const otp = otpGenrate()
            const userData = await userModel.create({ name:capitalizeFirstWord(name), email, password: hash, otp, otpExpire: (Date.now() + 10 * 60 * 1000) })
            const message = `<h1>Your OTP is ${otp}</h1><p>This code is valid for 10 minutes.</p>`;
            sendEmail(email, message)
            res.cookie("email", email, { maxAge: 10 * 60 * 1000, httpOnly: true,
  secure: true,
  sameSite: "None" });
            return res.status(200).json({ success: true, message: "Please verify your email.", email })
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }

}


const loginPost = async (req, res) => {
    try {
        const { email, password } = req.body
        const result = loginVal.safeParse({ email, password })
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }
        else if (!result.success) {
            return res.status(400).json({ success: false, message: result.error.issues[0].message })
        }
        else {
            const data = await userModel.findOne({ email: email })
            if (!data) {
                return res.status(400).json({ success: false, message: "User not found" })
            }
            else if (!data.isVerified) {
                return res.status(400).json({ success: false, message: "Email not verified" })
            }
            const passMatch = await bcrypt.compare(password, data.password)
            if (!passMatch) {
                return res.status(400).json({ success: false, message: "Invalid email or password" });

            }
            else {
                const otp = otpGenrate()
                await userModel.findOneAndUpdate({ email: email }, { otp: otp, otpExpire: (Date.now() + 10 * 60 * 1000), reset: false })
                const message = `<h1>Your OTP is ${otp}</h1><p>This code is valid for 10 minutes.</p>`;
                sendEmail(email, message)
                res.cookie("email", email, { maxAge: 10 * 60 * 1000, httpOnly: true,  secure: true,sameSite: "None" })
                return res.status(200).json({ success: true, message: "Please check your email", email })
            }
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const emailVerification = async (req, res) => {
    try {
        const email = req.cookies.email
        const data = await userModel.findOne({ email: email })
        const inputOtp = req.body.otp
        if (!email) {
            return res.status(400).json({ success: false, message: "Please sign up or log in. " })
        }
        else if (!data) {
            return res.status(400).json({ success: false, message: "Please register first." })
        }
        else if (!inputOtp) {
            return res.status(400).json({ success: false, message: "Please enter the OTP first." })
        }
        else if (data.otpExpire < Date.now()) {
            return res.status(400).json({ success: false, message: "Your OTP has expired." })
        }
        else if (inputOtp == data.otp) {
            const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "24h" })
            res.clearCookie("email")
            const result = await userModel.findOne({ email })
            if (data.isVerified && data.reset) {
                if (result.tempPassword) {
                    await userModel.findOneAndUpdate({ email: email }, { otpExpire: null, otp: null, reset: false, password: result.tempPassword })
                    return res.status(200).json({ success: true, message: "Password reset successfully." })
                }
                else {
                    await userModel.findOneAndUpdate({ email: email }, { otpExpire: null, otp: null, reset: false })
                    return res.status(400).json({ success: false, message: "Password reset failed." })
                }
            }
            else if (data.isVerified) {
                await userModel.findOneAndUpdate({ email: email }, { otpExpire: null, otp: null })
                res.cookie("token", token,{httpOnly: true,  secure: true,sameSite: "None"})
                return res.status(200).json({ success: true, message: "Login successfully." })
            }
            else {
                await userModel.findOneAndUpdate({ email: email }, { isVerified: true, otpExpire: null, otp: null })
                res.cookie("token", token,{httpOnly: true,  secure: true,sameSite: "None"})
                return res.status(200).json({ success: true, message: "Registered successfully" })
            }

        }
        else {
            return res.status(400).json({ success: false, message: "Wrong OTP" });

        }
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const resendOtp = async (req, res) => {
    try {
        const email = req.cookies.email
        if (!email) {
            return res.status(400).json({ success: false, message: "Please sign up or log in." })
        }
        const data = await userModel.findOne({ email: email })
        if (!data) {
            return res.status(400).json({ success: false, message: "please login" })
        }
        else {

            const otp = otpGenrate()
            const message = `<h1>Your OTP is ${otp}</h1><p>This code is valid for 10 minutes.</p>`;

            await userModel.findOneAndUpdate({ email: email }, { otp: otp, otpExpire: Date.now() + 10 * 60 * 1000 })
            sendEmail(email, message)
            return res.status(200).json({ success: true, message: "otp send successfully" })
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }

}

const logout = (req, res) => {
    try {
        res.clearCookie("token",{httpOnly: true,  secure: true,sameSite: "None"})
        return res.status(200).json({ success: true, message: "logout successfully" })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'productImg')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const imgFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpg", "image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    }
    else {
        cb(new Error("only jpg or png file allow"), false)
    }
}

const upload = multer({ storage: storage, fileFilter: imgFilter }).single("img")

const productPost = async (req, res) => {
    const user = jwt.verify(req?.cookies?.token, process?.env?.SECRET_KEY)?.email
    const findData = await userModel.findOne({ email: user })
    const newData = await productModel.findOne({ user: findData.id })
    upload(req, res, async (err) => {
        try {
            const { productName, description, category, subCategory, price, sizes, color, brand, discount, imgName, productId, productId2, update, imgPath } = req.body
            const arr = JSON.parse(sizes || "[]");
            
            if (err) {
                return res.status(400).json({ success: false, message: err.message })
            }
            else if (productId) {

                if (!productName || !description || !category || !subCategory || !price || !color || !brand || arr.length == 0) {
                    return res.status(400).json({ success: false, message: "All fields are required" })
                }
                else {

                    await productModel.updateOne({ _id: productId }, { productName: capitalizeFirstWord(productName), description, color: capitalizeFirstWord(color), category: capitalizeFirstWord(category), subCategory, price, sizes:arr, brand: capitalizeFirstWord(brand), discount });


                    return res.status(200).json({ success: true, message: "Product updated successfully." })
                }
            }
            else if (!req.file) {
                return res.status(400).json({ success: false, message: "All fields are requireds" })
            }
            else if (!productName || !description || !category || !subCategory || !price || !color || !brand || arr.length == 0) {
                fs.unlinkSync(req.file.path)
                return res.status(400).json({ success: false, message: "All fields are required" })
            }
            else if (update == "update") {
                fs.unlinkSync(imgPath)
                await productModel.updateOne({ _id: productId2 }, { productName: capitalizeFirstWord(productName), description, color: capitalizeFirstWord(color), category: capitalizeFirstWord(category), subCategory, price, sizes:arr, brand: capitalizeFirstWord(brand), discount, imgName, img: req.file.path });

                return res.status(200).json({ success: true, message: "Product updated successfully" })
            }
            else {
                await productModel.create({ productName:capitalizeFirstWord(productName), description, color:capitalizeFirstWord(color), category: capitalizeFirstWord(category), subCategory, price, sizes:arr, brand:capitalizeFirstWord(brand), discount, user: findData.id, imgName, img: req.file.path });

                return res.status(200).json({ success: true, message: "Product added successfully." })
            }
        }
        catch (err) {
            
            return res.status(500).json({ success: false, message: "server errorrr" })
        }
    })

}

const product = async (req, res) => {
    const data = await productModel.find({})
    res.send(data)
}

const isAuth = async (req, res) => {
    try {
        const token = req?.cookies?.token
        if (!token) {
            return res.status(401).json({ success: false, message: "you are not authenticated" })
        }
        const decoded = jwt.verify(req?.cookies?.token, process.env.SECRET_KEY)
        if (!decoded?.email) {
            return res.status(401).json({ success: false, message: "you are not authenticated" })
        }
        const data = await userModel.findOne({ email: decoded?.email })
        const userOrderData = await orderModel.find({ user: data._id })
        if (!data?.isVerified && !data?.clickAuth) {
            return res.status(401).json({ success: false, message: "You are not registered" })
        }

        else {
            return res.status(200).json({ success: true, message: "You are logged in.", data: data,email:decoded.email,userOrderData})
        }
    }
    catch (err) {

        return res.status(500).json({ success: false, message: "server error" })
    }
}

const clickAuthRegister = async (req, res) => {
    try {
        const { email, emailVerified } = req.body
        if (!email || !emailVerified) {
            return res.status(400).json({ success: false, message: "email not verified" })
        }
        const user = await userModel.findOne({ email })
        if (user?.clickAuth) {
            return res.status(400).json({ success: false, message: "This email is already exist" })
        }
        else if (user) {
            const data = await userModel.updateOne({ email }, { clickAuth: emailVerified })
            const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "24h" })
            res.cookie("token", token,{httpOnly: true,  secure: true,sameSite: "None"})
            return res.status(200).json({ success: true, message: "register successfully" })
        }
        else {
            const data = await userModel.create({ email, clickAuth: emailVerified })
            const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "24h" })
            res.cookie("token", token,{httpOnly: true,  secure: true,sameSite: "None"})
            return res.status(200).json({ success: true, message: "register successfully" })
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const clickAuthLogin = async (req, res) => {
    try {
        const { email, emailVerified, providerType } = req.body
        if (!email || !emailVerified) {
            return res.status(400).json({ success: false, message: `${providerType} email not verified` })
        }
        const user = await userModel.findOne({ email })
        if (user?.email !== email || !user?.clickAuth) {
            return res.status(400).json({ success: false, message: "You are not registered" })
        }
        else {
            const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "24h" })
            res.cookie("token", token,{httpOnly: true,  secure: true,sameSite: "None"})
            return res.status(200).json({ success: true, message: "login successfully" })
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const resetPassword = async (req, res) => {
    try {
        const { email, password, rePassword } = req.body
        const result = loginVal.safeParse({ email, password })
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }
        else if (!result.success) {
            return res.status(400).json({ success: false, message: result.error.issues[0].message })
        }
        else {
            const otp = otpGenrate()
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(password, salt)
            await userModel.findOneAndUpdate({ email }, { otp, otpExpire: Date.now() + 10 * 60 * 1000, reset: true, tempPassword: hash })
            res.cookie("email", email, { maxAge: 10 * 60 * 1000, httpOnly: true,
  secure: true,
  sameSite: "None" });
            return res.status(200).json({ success: true, message: "Please verify your email.", email })
        }

    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const manageReviews = async (req, res) => {
    try {
        const { selectedStar, reviewMsg, productId } = req.body
        const token = req?.cookies?.token
        if (!token) {
            return res.status(401).json({ success: false, message: "you are not authenticated" })
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        const user = await productModel.findOne({ _id: productId })
        if (!selectedStar || !reviewMsg) {
            return res.status(400).json({ success: false, message: "review comment cannot be empty" })
        }
        const filter = user.userReviews.filter((obj) => obj.email == decoded.email)
        if (filter.length) {
            const result = await productModel.findOneAndUpdate({ "userReviews.email": decoded.email }, {
                $set: {
                    "userReviews.$[elem].star": selectedStar,
                    "userReviews.$[elem].reviewMsg": reviewMsg,
                    "userReviews.$[elem].date": Date.now()
                }
            }, {
                arrayFilters: [{ "elem.email": decoded.email }],
                new:true
            })
            
            return res.status(200).json({ success: true, message: "Review updated successfully.",data: result})
        }
        else {
            const resp = await productModel.findOneAndUpdate({ _id: productId }, { $push: { userReviews: { email: decoded.email, star: selectedStar, reviewMsg, date: Date.now() } } })
            const resp1 = await productModel.findOne({ _id: productId })
            
            return res.status(200).json({ success: true, message: "review submitted successfully", data: resp1 })
        }
    }
    catch (err) {
        
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const myProducts = async (req, res) => {
    try {

        if (!req?.cookies?.token) {
            return res.status(400).json({ success: false, message: "you are not login" })
        }
        const decoded = jwt.verify(req?.cookies?.token, process.env.SECRET_KEY)
        if (!decoded.email) {
            return res.status(400).json({ success: false, message: "you are not login" })
        }
        const user = await userModel.findOne({ email: decoded.email })
        if (!user) {
            return res.status(400).json({ success: false, message: "you are not Registered" })
        }
        const products = await productModel.find({ user: user.id })
        if (!products) {
            return res.status(400).json({ success: false, message: "no products found" })
        }
        else {
            return res.status(200).json({ success: true, message: "products found", data: products })
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const deleteProduct = async (req, res) => {
    const { productId, imgPath } = req.body
    try {

        if (!productId) {
            return res.status(400).json({ success: false, message: "you are not login" })
        }
        else if (productId) {
            fs.unlinkSync(imgPath)
            await productModel.deleteOne({ _id: productId })
            return res.status(200).json({ success: true, message: "product deleted successfully" })
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const payment=async(req,res)=>{
    try{
     const {firstName,lastName,email,street,city,state,postalCode,country,phoneNumber,orderId,method,orderDetails,orderPrice}=req.body
     if (!req?.cookies?.token) {
            return res.status(400).json({ success: false, message: "you are not login" })
        }
        const decoded = jwt.verify(req?.cookies?.token, process.env.SECRET_KEY)
        if (!decoded.email) {
            return res.status(400).json({ success: false, message: "you are not login" })
        }
        const user = await userModel.findOne({ email: decoded.email })
        if (!user) {
            return res.status(400).json({ success: false, message: "you are not Registered" })
        }
     if(!firstName || !lastName || !email || !street || !city || !state || !postalCode || !country || !phoneNumber){
        return res.status(400).json({ success: false, message: "All fields are required" })
     }
     if(method=="cash on delivery"){
        await orderModel.create({ firstName: capitalizeFirstWord(firstName), lastName, email, street, city: capitalizeFirstWord(city), state: capitalizeFirstWord(state), postalCode, country: capitalizeFirstWord(country), phoneNumber, orderId, orderMethod: "Cash on delivery", orderStatus: "Order Placed", paymentStatus: "Unpaid", orderDetails, orderPrice, user: user._id });
        return res.status(200).json({ success: true, message: "Order placed successfully" })
     }
     if(method=="razorpay"){
    const razorpayInstance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
     });

     const option={
        amount:orderPrice*100,
        currency: "INR",
        receipt: "order_rcptid_11"
    }
    razorpayInstance.orders.create(option,(err,order)=>{
       if(err){
        return res.status(500).send({success:false,message:"Order creation failed"});
       }
       return res.status(200).send({success:true,...order})
    })
}
   }
   catch(err){
    return res.status(500).send({success:false,message:"Server error1",perr:process.env.key_id})
   }
}

const paymentSuccess=async(req,res)=>{
    try{
     const {firstName,lastName,email,street,city,state,postalCode,country,phoneNumber,orderId,method,orderDetails,orderPrice}=req.body
     const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body

     const generated_signature = crypto
  .createHmac("sha256", process.env.key_secret)
  .update(razorpay_order_id + "|" + razorpay_payment_id)
  .digest("hex");

    if (generated_signature == razorpay_signature) {

        const decoded = jwt.verify(req?.cookies?.token, process.env.SECRET_KEY)
        const user = await userModel.findOne({ email: decoded.email })
        await orderModel.create({firstName,lastName,email,street:capitalizeFirstWord(street),city:capitalizeFirstWord(city),state:capitalizeFirstWord(state),postalCode,country:capitalizeFirstWord(country),phoneNumber,orderId,orderMethod:"Razorpay",orderStatus:"Order Placed",paymentStatus:"Paid",orderDetails,orderPrice,user:user._id})
        return res.status(200).json({ success: true, message: "Order placed successfully" })
     }
    return res.status(400).send({success:false,message:"payment failed"});
   }
   catch(err){
    
    return res.status(500).send({success:false,message:"Server error2"})
   }
}

const AdminLoginPost = async (req, res) => {
    try {
        const { email, password } = req.body
        const result = AdminLoginVal.safeParse({ email})
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }
        else if (!result.success) {
            return res.status(400).json({ success: false, message: result.error.issues[0].message })
        }
        else {
            const data = await userModel.findOne({ email: email })
            if (!data) {
                return res.status(400).json({ success: false, message: "User not found" })
            }
            else if (!data.isVerified) {
                return res.status(400).json({ success: false, message: "Email not verified" })
            }
            const passMatch = await bcrypt.compare(password, data.password)
            if (!passMatch) {
                return res.status(400).json({ success: false, message: "Invalid email or password" });

            }
            else if(email!="amaanahmad8616@gmail.com"){
                return res.status(400).json({ success: false, message: "Invalid email or password" });
            }
            else {
                const otp = otpGenrate()
                await userModel.findOneAndUpdate({ email: email }, { otp: otp, otpExpire: (Date.now() + 10 * 60 * 1000), reset: false })
                const message = `<h1>Your OTP is ${otp}</h1><p>This code is valid for 10 minutes.</p>`;
                sendEmail(email, message)
                res.cookie("email", email, { maxAge: 10 * 60 * 1000, httpOnly: true,
  secure: true,
  sameSite: "None" })
                return res.status(200).json({ success: true, message: "Please check your email", email })
            }
        }
    }
    catch (err) {
    
        return res.status(500).json({ success: false, message: "server error" })
    }
}

const AdminIsAuth = async (req, res) => {
    try {
        const token = req?.cookies?.token
        if (!token) {
            return res.status(401).json({ success: false, message: "you are not authenticated" })
        }
        const decoded = jwt.verify(req?.cookies?.token, process.env.SECRET_KEY)
        if (!decoded?.email) {
            return res.status(401).json({ success: false, message: "you are not authenticated" })
        }
        const data = await userModel.findOne({ email: decoded?.email })
        const allUsers = await userModel.find()
        const orderData = await orderModel.find()
        const userOrderData = await orderModel.find({ user: data._id })
        if (!data?.isVerified && !data?.clickAuth) {
            return res.status(401).json({ success: false, message: "You are not registered" })
        }

        else {
            return res.status(200).json({ success: true, message: "You are logged in.", data: data,orderData,email:decoded.email,userOrderData,allUsers })
        }
    }
    catch (err) {

        return res.status(500).json({ success: false, message: "server error" })
    }
}

const manageStatus=async(req,res)=>{
    const {status,orderId}=req.body
    try{
        const isData=orderModel.findOne({_id:orderId})
        if(isData){
            await orderModel.updateOne({_id:orderId},{orderStatus:status})
            return res.status(200).json({ success: true, message: "Status updated successfully"})
        }
        else{
            return res.status(200).json({ success: true, message: "Something is wrong"})
        }
    }
     catch (err) {

        return res.status(500).json({ success: false, message: "server error" })
    }
}


module.exports = { registerPost, loginPost,AdminLoginPost, emailVerification, logout, productPost, resendOtp, product, isAuth,AdminIsAuth, clickAuthRegister, clickAuthLogin, resetPassword, manageReviews, myProducts, deleteProduct,payment,paymentSuccess,manageStatus }
