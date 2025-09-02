const {z}=require("zod")

const registerVal=z.object({
    name:z.string().trim(),
    email:z.string().trim().email({message:"Enter Valid Email"}).refine((v)=>v.includes("@gmail.com"),{message:"Enter Valid Email"}),
    password:z.string().trim().refine((v)=>
        v.length>=8 &&
        v.length<=30 &&
        /[A-Z]/.test(v) &&
        /[a-z]/.test(v) &&
        /[0-9]/.test(v) &&
        /[^A-Za-z0-9]/.test(v)
        ,{message:"Password must be 8 character 1 letter number and special character"}
    )
})

const loginVal=z.object({
    email:z.string().trim().email({message:"Enter Valid Email"}).refine((v)=>v.includes("@gmail.com"),{message:"Enter Valid Email"})
})

const AdminLoginVal=z.object({
    email:z.string().trim().email({message:"Enter Valid Email"}).refine((v)=>v.includes("@gmail.com"),{message:"Enter Valid Email"})
})


module.exports={registerVal,loginVal,AdminLoginVal}