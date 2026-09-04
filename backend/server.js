require("dotenv").config();
const app = require("./src/app");
require('./src/db/db');

app.listen(3000,()=>{
    console.log("Server running on port 3000");
})