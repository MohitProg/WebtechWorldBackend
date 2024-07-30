import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import userRoute from "./Routes/User.route.js"

import blogroute from "./Routes/Blogs.route..js";
import projectroute from "./Routes/Projects.route.js"

const app=express();
app.use(cookieParser())
app.use(express.static("public"));

app.use(express.json())


app.use(cors())


// routes for file 
app.use("/api/v1/user",userRoute);
app.use("/api/v1/blog",blogroute)
app.use("/api/v1/project",projectroute)





export {app};