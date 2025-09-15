const mongoose=require("mongoose")
const dbConnection=async()=>{
    try{
await mongoose.connect(process.env.CONNECTION_URL)
console.log("DB Connected")
    }
    catch(err){
        console.log("DB Connection failed")
    }
}
module.exports=dbConnection()