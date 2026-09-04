const  prisma = require("../db/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// /api/auth/register
const register = async(req,res)=>{


try{
         const {name,email,password,profileUri,githubUri,bio} = req.body;
    const isUserAlreadyExist = await prisma.user.findUnique({
        where:{email}
    })

    if(isUserAlreadyExist){
        return res.status(409).json({
            message:"User already exist "
        })
    }
    const hash = await bcrypt.hash(password,10);
   

    const user = await prisma.user.create({
        data:{
            name,
            email,
            password:hash,
            profileUri : profileUri|| null,
            githubUri : githubUri|| null,
            bio:bio || null
        }
    })
    const refreshToken = jwt.sign({email:user.email,id:user.id},process.env.JWT_SECRET,{expiresIn:"7d"});
    const accessToken  = jwt.sign({email:user.email,id:user.id},process.env.JWT_SECRET,{expiresIn:"15m"});
    // now refreshToken will go into cookie
    res.cookie("refreshToken",refreshToken,{
                httpOnly:true,
                secure:process.env.NODE_ENV === "production",
                sameSite:'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000

            });
            
    

    return res.status(201).json({
        message:"User created successfully",
        user:{
            email:user.email,
            name:user.name,
            profileUri:profileUri,
            githubUri : githubUri,
            bio:bio
        },
        accessToken
    })
    }catch(err){
         return res.status(500).json({
            message:"Something went wrong "
        })
    }
   


}
const login = async(req,res)=>{

  try{
            const {email,password} = req.body;
            const user = await prisma.user.findUnique({
                where:{email}
            })

            if(!user){
                return res.status(404).json({
                    message:"Invalid Credentials"
                })
            }
            const result = await bcrypt.compare(password,user.password);
            if(!result){
                return res.status(401).json({
                    message:"Invalid Credentials"
                })
            }
            const refreshToken = jwt.sign({email:user.email,id:user.id},process.env.JWT_SECRET,{expiresIn:"7d"});
            const accessToken  = jwt.sign({email:user.email,id:user.id},process.env.JWT_SECRET,{expiresIn:"15m"});
            res.cookie("refreshToken",refreshToken,{
                httpOnly:true,
                secure:process.env.NODE_ENV === "production",
                sameSite:'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000

            });
            return res.status(201).json({
                message:"User logged in successfully",
                accessToken
            })
  }catch(err){
      return res.status(500).json({
            message:"Something went wrong "
    })
  }
    


}
const refresh  = async(req,res)=>{
    let token = req.cookies.refreshToken;
    if(!token){
        return res.status(404).json({
            message:"Unauthorized access, Token not found"
        })
    }
    const refreshTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const isBlackListed = await prisma.blackList.findUnique({
        where:{
            refreshTokenHash
        }
    })

    if(isBlackListed){
        return res.status(401).json({
            message:"Unauthorized access, Invalid token"
        })
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const accessToken  = jwt.sign({email:decoded.email,id:decoded.id},process.env.JWT_SECRET,{expiresIn:"15m"});
        return res.status(200).json({
            message:"Token refreshed successfully",
            accessToken
        })
    }catch(err){
         return res.status(401).json({
            message:"Unauthorized access, Invalid token"
        })
    }
}
const logout = async(req,res)=>{
    let token = req.cookies.refreshToken;
    if(!token){
        return res.status(404).json({
            message:"Unauthorized access, Token not found"
        })
    }
    const refreshTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const blacklist = await prisma.blackList.create({
        data:{
            refreshTokenHash
        }
    })
    res.clearCookie("refreshToken",{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict'
    });
    res.status(201).json({
        message:"Logout successfully"
    })
} 



module.exports = {register,login,refresh,logout};