const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.router");
const userRouter= require("./routes/user.router");
const projectRouter = require("./routes/project.router");
const app = express();
app.use(express.json());
app.use(cookieParser());


// /api/auth
app.use("/api/auth",authRouter);
app.use("/user",userRouter);
app.use("/api/project",projectRouter)
module.exports = app;