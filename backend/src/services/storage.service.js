const {ImageKit,toFile} = require("@imagekit/nodejs");
const ImageKitClient = new ImageKit({
    privateKey:process.env.IMAGE_KIT_PRIVATE_KEY
})
const uploadfile = async (buffer)=>{
   const result = await ImageKitClient.files.upload({
        file:await toFile(buffer),
        fileName : "Profile_" + Date.now(),
        folder:"DevStash"

   })
   return result;
}
module.exports = {uploadfile};