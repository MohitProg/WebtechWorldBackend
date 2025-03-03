import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./Routes/User.route.js"

import blogroute from "./Routes/Blogs.route..js";
import projectroute from "./Routes/Projects.route.js"
import commentRoute from "./Routes/commentroute.js"
import { errorHandler } from "./Utils/ApiError.js";

const app=express();
app.use(cookieParser())
app.use(express.static("public"));

app.use(express.json())

app.use(cors({
    origin:["http://localhost:5173","https://webtechversion2.web.app"],
    methods:["GET","POST","PUT","DELETE"]
}));



// routes for file 
app.use("/api/v1/user",userRoute);
app.use("/api/v1/blog",blogroute)
app.use("/api/v1/user/project",projectroute)
app.use("/api/v1/user/blog/comment",commentRoute)
app.use(errorHandler)

app.get("/",(req,res)=>{
    return res.send("Website is running ")
})



export {app};