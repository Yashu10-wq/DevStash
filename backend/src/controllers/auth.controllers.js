const  prisma = require("../db/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const emailService = require("../services/email.service");
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
    // 1. Generate 6-digit OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// 2. Email Subject
const subject = "Verify your DevStash account 🚀";

// 3. Plain Text Fallback (agar HTML render na ho)
const text = `Welcome to DevStash! Your email verification code is: ${otp}. This code is valid for 10 minutes. Please do not share this code with anyone.`;

// 4. Beautiful HTML Template
const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
    <h2 style="color: #1a1a1a; margin-bottom: 20px;">Welcome to DevStash! 🚀</h2>
    <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Hi there,</p>
    <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Thank you for joining DevStash. To complete your registration and start organizing your projects, please use the verification code below:</p>
    
    <div style="text-align: center; margin: 40px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; padding: 15px 25px; background-color: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb;">
            ${otp}
        </span>
    </div>
    
    <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6;">
        ⏳ <strong>Note:</strong> This code is valid for the next <strong>10 minutes</strong>.
    </p>
    <p style="color: #737373; font-size: 14px; margin-top: 30px;">
        If you didn't create an account with DevStash, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
    
    <div style="text-align: center; color: #8b8b8b; font-size: 13px;">
        <p style="margin: 5px 0;">Keep building awesome things!</p>
        <p style="margin: 5px 0;"><strong>The DevStash Team</strong></p>
    </div>
</div>
`;
    await emailService.sendEmail(email,subject,text,html);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt =new Date(Date.now() + 10 * 60 * 1000) ;
    await prisma.otpVerification.create({
        data:{
            email,
            otp:otpHash,
            expiresAt
        }
    })
  

    return res.status(201).json({
        message:"User created successfully and Otp(expires in 10 m) is sent to your mail",
        user:{
            email:user.email,
            name:user.name,
            profileUri:profileUri,
            githubUri : githubUri,
            bio:bio
        }
        
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
            if(!user.isEmailVerified){
                return res.status(404).json({
                    message:"User not verified "
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
const verifyEmail = async(req,res)=>{
    const {email,otp} = req.body;
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
      const isOtpValid =await prisma.otpVerification.findFirst({
        where:{
            email,
            otp:otpHash
        }
      })
      if(!isOtpValid){
        return res.status(404).json({
            message:"Otp/ email not found or Otp is expired"
        })
      }
      const checkDate = new Date(Date.now());
      if(checkDate>isOtpValid.expiresAt){
        await prisma.otpVerification.delete({
            where: { email }
         });
         return res.status(400).json({
            message: "OTP is expired. Please request a new one."
         });
      }

      
      const user = await prisma.user.findFirst({
        where:{
            email
        }
      })

      if(!user){
        return res.status(501).json({
            message:"User is not registered to verify email"
        })
      }

      await prisma.user.update({
        data:{
            isEmailVerified : true
        },
        where:{
            email
        }
      })
   
      await prisma.otpVerification.deleteMany({
        where:{
            email,
           
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

            res.status(201).json({
                message:"User verified successfully and token generated",
                accessToken
            })
            
    
}


module.exports = {register,login,refresh,logout,verifyEmail};