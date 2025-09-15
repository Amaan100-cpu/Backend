const express = require("express")
const router=express.Router()
const {registerPost,loginPost,AdminLoginPost,logout,emailVerification,productPost,product,resendOtp,isAuth,AdminIsAuth,clickAuthRegister,clickAuthLogin,resetPassword,manageReviews,myProducts,deleteProduct,payment,paymentSuccess,manageStatus}=require("../controller/userController.js")
const {userVerified,isLogin,productVal}=require("../middlewares/cheack.js")




router.get("/logout",logout)

router.get("/product",product)

router.post("/product/post",productPost)

router.post("/register/post",userVerified,registerPost)

router.post("/login/post",loginPost)

router.post("/AdminLoginPost",AdminLoginPost)

router.post("/emailVerification", emailVerification)

router.get("/resendOtp",resendOtp)

router.get("/isAuth",isAuth)

router.get("/adminIsAuth",AdminIsAuth)

router.post("/clickAuthRegister",clickAuthRegister)

router.post("/clickAuthLogin",clickAuthLogin)

router.post("/resetPassword",resetPassword)

router.post("/reviews",manageReviews)

router.get("/myProducts",myProducts)

router.post("/deleteProduct",deleteProduct)

router.post("/payment",payment)

router.post("/payment-success",paymentSuccess)

router.post("/manageStatus",manageStatus)

module.exports=router