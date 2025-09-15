const userModel=require("../models/userModel.js")
const jwt=require("jsonwebtoken")


const userVerified=async(req,res,next)=>{
    const {email}=req.body
    const result=await userModel.findOne({email})
    if(result && !result.isVerified && !result.clickAuth){
        await userModel.deleteOne({email})
        next()
    }
    else{
        next()
    }
}


const isLogin=async(req,res,next)=>{

    try{
        const decoded=jwt.verify(req?.cookies?.token,process.env.SECRET_KEY)
        if(!decoded){
            return res.status(400).json({success:false,message:"you are not login"}) 
        }
        const data=await userModel.findOne({email:decoded?.email})
        if(!data?.email){
            return res.status(400).json({success:false,message:"you are not register"})
        }
        
        else{
            next()
        }
    }
    catch(err){
        console.log(err.message)
        return res.status(400).json({success:false,message:"jwt expire"})
    }
}

const productVal=(req,res,next)=>{
const {productName,description,category,subCategory,price,sizes}=req.body
const arr=JSON.parse(sizes)
console.log(arr.length)
if(!productName || !description || !category || !subCategory || !price || !arr.length){
        return res.send("All field is required")
    }
    
    else{
        next()
    }
}
module.exports={userVerified,isLogin,productVal}