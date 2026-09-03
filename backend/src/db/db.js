const {PrismaClient} = require("@prisma/client");
const prisma = new  PrismaClient();
const connectDb = async ()=>{
    try{
        await prisma.$connect();
        console.log("Connected to postgres SQL DB")
    }catch(err){
        console.log(`Error connecting to db ${err}`)
        process.exit(1);
    }
}
module.exports = connectDb;
