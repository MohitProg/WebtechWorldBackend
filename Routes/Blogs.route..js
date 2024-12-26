import express from "express";
import AuthCheck from "../Middleware/Auth.js";

import { upload } from "../Middleware/multer.middleware.js";

import {Getblogdata,PostBlogdata,UpdateBlogdata,DeleteBlogdata, GetUserblogsdata, GetBlogbyId, GetblogbyCategorys, checkandAddrecentblog, Getrecentblogdata, SavedBlog, GetSavedblogdata, LikeAndDisliketheblog} from "../Controllers/BlogControll.js"

const route=express.Router();


route.get("/getblogs",Getblogdata);
route.post("/savedblog/:id",AuthCheck,SavedBlog)
route.get("/getsavedblog",AuthCheck,GetSavedblogdata)

route.get("/category",GetblogbyCategorys);
route.put("/recentblog/:id",AuthCheck,checkandAddrecentblog);
route.get("/getrecentblog",AuthCheck,Getrecentblogdata);


route.get("/getblogs/:id", GetBlogbyId)
route.get("/getuserblogs", AuthCheck,GetUserblogsdata)
route.post("/postblogs",AuthCheck,upload.single("file"),PostBlogdata)
route.put("/updateblog/:id",AuthCheck, upload.single("file"),UpdateBlogdata)
route.delete("/deleteblog/:id",AuthCheck,DeleteBlogdata)
// like and dislike the blogs 
route.post("/likeanddislike/:id",AuthCheck,LikeAndDisliketheblog)

    



export default route;