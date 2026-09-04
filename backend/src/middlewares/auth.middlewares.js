const prisma = require("../db/db");
const jwt = require("jsonwebtoken");
const isLoggedIn  = async(req,res,next)=>{
    let authHeader = req.headers.authorization;
   if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Token not found or format is incorrect"
        });
    }
    let token = req.headers.authorization.split(" ")[1];
    if(!token){
        return res.status(401).json({
            message:"Token not found"
        })
    }
    try{
        let decoded = jwt.verify(token,process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where:{email:decoded.email}
        })
        req.user= user;

        next();
    }catch(err){
        return res.status(401).json({
            message:"Invalid token"
        })
    }



}

module.exports = {isLoggedIn};