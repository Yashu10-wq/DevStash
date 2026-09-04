const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.router");
const app = express();
app.use(express.json());
app.use(cookieParser());


// /api/auth
app.use("/api/auth",authRouter);
module.exports = app;