const prisma = require("../db/db");

const registerProject = async (req, res) => {
    try {
        const { title, description, techStack, repositoryUrl, liveUrl, aiChatUris, architectureLog } = req.body;
        if (!title) {
            return res.status(400).json({
                message: "Title is required to create a project"
            })
        }
        const user = req.user;
        const newProject = await prisma.project.create({
            data: {
                title,
                description,
                techStack: techStack || [],
                repositoryUrl,
                liveUrl,
                aiChatUris: aiChatUris || [],
                architectureLog,
                userId: user.id
            }
        })

        return res.status(201).json({
            message: "project created successfully",
            newProject
        })
    } catch (err) {
        return res.status(500).json({
            message: "Something went wrong",
            error: err
        })
    }


}
const getAllProjects = async (req, res) => {
    try{
         const user = req.user;
    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { userId: user.id },
                {
                    collaborators: {
                        some: {
                            userId: user.id
                        }
                    }
                }
            ]


        },
        include: {
            owner: {
                select: {
                    name: true,
                    profileUri: true,
                    avatarUri: true,
                    useAvatar: true
                }
            },
            collaborators: {
                include: {
                    user: {
                        select: {
                            name: true,
                            profileUri: true,
                            avatarUri: true,
                            useAvatar: true
                        }
                    }
                }

            },


        },
        orderBy: {
            updatedAt:'desc'
        }
    })

   return res.status(200).json({
            message: "Projects fetched successfully",
            projects
        });

}catch(err){
        return res.status(500).json({
            message: "Something went wrong",
            error: err.message
        })
    }
   
}
const getProjectById  = async(req,res)=>{

    try{
        const user  = req.user;
    const projectId = req.params.id;
    const project = await prisma.project.findFirst({
        where:{
            id:projectId,
            OR:[
                {userId:user.id},
                {
                    collaborators:{
                        some:{
                            userId:user.id
                        }
                }
            }
            ]
        },
        include:{
            owner:{
                select: {
                        id: true,
                        name: true,
                        email: true,
                        profileUri: true,
                        avatarUri: true,
                        useAvatar: true
                    }
            },
            collaborators:{
                include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profileUri: true,
                                avatarUri: true,
                                useAvatar: true
                            }
                        }
                    }
            }
        }
    })

    if(!project){
        return res.status(404).json({
            message:"Project not found or you dont have access to view the project"
        })
    }

    return res.status(200).json({
        message:"Project fetched successfully",
        project
    })
    }catch(err){
        return res.status(500).json({
            message:"Something went wrong",
            error:err.message
        })
    }
    


}


const updateProject =  async(req,res)=>{
    try {
        const user = req.user;
        const projectid = req.params.id;
        const project = await prisma.project.findFirst({
            where:{
                id:projectid,
                OR:[
                    {
                        userId:user.id
                    },
                    {
                       collaborators:{
                        some:{
                            userId:user.id
                        }
                       }
                    }
                ]
            }
        })
        if(!project){
            return res.status(404).json({
            message:"Project not found or you dont have access to view the project"
        })
        }

        const {title,description,techStack,status,liveUrl,aiChatUris,repositoryUrl,architectureLog} = req.body;
        const updateData={
            title,
            description,
            techStack,
            status,
            liveUrl,
            aiChatUris,
            repositoryUrl,
            architectureLog

        }
        for(let key in updateData){
            if(updateData[key]===null){
                delete updateData[key];
            }
        }
        const updatedProject = await prisma.project.update({
            data:updateData,
            where:{
                id:project.id
            }
        })
        return res.status(201).json({
            message:"Project updated successfully",
            updatedProject
        })

        
    } catch (err) {
        return res.status(500).json({
            message:"Something went wrong",
            error:err.message
        })
    }
}


const deleteProject  = async(req,res)=>{
try{
     const user = req.user;
        const projectid = req.params.id;
        const project = await prisma.project.findFirst(
            {
                where:{
                    AND:[
                        {
                            id:projectid
                        },
                        {
                            userId:user.id
                        }
                    ]
                }
            }

        )
        if(!project){
            return res.status(404).json({
            message:"Project not found or you dont have access to view the project"
        })
        }
        await prisma.project.delete({
            where:{
                id:projectid
            }
        })
 return res.status(204).json({
            message:"Project deleted successfully",
            
        })



}catch(err){
     return res.status(500).json({
            message:"Something went wrong",
            error:err.message
        })
}
}
module.exports = { registerProject, getAllProjects, getProjectById,updateProject,deleteProject};