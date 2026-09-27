const prisma = require("../db/db");
const storageService = require("../services/storage.service");
const updateProfile = async (req, res) => {
    try {
        const { name, bio, githubUri } = req.body;
        
        // 1. Ek safe object banao jo sirf valid data store karega
        const updateData = {};

        // 2. Jo fields aayi hain, unko object mein daalo
        if (name !== undefined) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (githubUri !== undefined) updateData.githubUri = githubUri;

        // 3. Agar naam change hua hai, tabhi naya avatar generate karo
        if (name) {
            updateData.avatarUri = `https://api.dicebear.com/9.x/lorelei/svg?seed=${name.replace(/\s+/g, '')}`;
        }

        // 4. Agar nai image aayi hai, sirf tab hi useAvatar ko false karo
        if (req.file && req.file.buffer) {
            const profileUri = req.file.buffer;
            console.log("File received, uploading...");
            
            const result = await storageService.uploadfile(profileUri); // const add kiya
            
            updateData.profileUri = result.url;
            updateData.useAvatar = false; // Nayi real photo aa gayi, toh avatar hide karo
        }

        // 5. Prisma mein update Data bhej do (purani cheezein safe rahengi)
        const updatedUser = await prisma.user.update({
            where: {
                id: req.user.id 
            },
            data: updateData 
        });

        return res.status(200).json({ // Update ke liye 200 standard hai
            message: "User updated successfully",
            user: {
                name: updatedUser.name,
                githubUri: updatedUser.githubUri,
                profileUri: updatedUser.profileUri,
                email: updatedUser.email,
                avatarUri: updatedUser.avatarUri,
                useAvatar: updatedUser.useAvatar
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ // 500 server error ke liye
            message: "Error in updating",
            err: err.message
        });
    }
}
module.exports = {updateProfile};