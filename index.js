const express = require("express")
const cookieParser=require("cookie-parser")
const app = express()
const path = require('path');
const dotenv=require("dotenv")
dotenv.config()
require("./db.js")
const cors=require("cors")
app.set("view engine","ejs")
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cookieParser())
const registerRout=require("./routes/userRout.js")

app.use(cors({
  origin: process.env.REACT_URL,
  credentials:true
}));
app.use("/productImg",express.static("./productImg"))

app.use("/",registerRout)


app.listen(process.env.PORT, () => {
    console.log(`server is start on ${process.env.PORT}`)
})