import { query } from "express";
import BlogModel from "../Modals/BlogModel.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { UploadOnCloudinary } from "../Utils/Cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import Usermodel from "../Modals/Usermodel.js";
import { SendAddBlogNotification } from "../Middleware/SendMail.js";
import { trusted } from "mongoose";
import TurndownService from "turndown";
import { ApiError } from "../Utils/ApiError.js";

let turndownService = new TurndownService();

const Getblogdata = async (req, res, next) => {
  const { page, limit, search, category } = req.query;
  console.log(req.query);
  const pagevalue = parseInt(page) || 1;
  const limitvalue = parseInt(limit) || 10;
  const skip = (pagevalue - 1) * limitvalue;

  const ctgry = category === "All Blogs" ? "" : category;
  try {
    let getBlogs;
    let totalblog;

    getBlogs = await BlogModel.find({
      $and: [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
            { summary: { $regex: search, $options: "i" } },
          ],
        },
        {
          category: {
            $elemMatch: {
              $regex: `.*${ctgry}.*`, // Apply regex
              $options: "i",
            },
          },
        },
      ],
    })
      .skip(skip)
      .limit(limitvalue)
      .sort({ createdAt: -1 })
      .populate("Author");

    totalblog = (
      await BlogModel.find({
        $and: [
          {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { content: { $regex: search, $options: "i" } },
              { summary: { $regex: search, $options: "i" } },
            ],
          },
          {
            category: {
              $elemMatch: {
                $regex: `.*${category}.*`, // Apply regex
                $options: "i", // Case-insensitive search
              },
            },
          },
        ],
      })
    ).length;

    return res
      .status(201)
      .send(new ApiResponse(200, { getBlogs, totalblog }, "getallblogs"));
  } catch (error) {
    next(error);
  }
};

// post single blog data
const PostBlogdata = async (req, res, next) => {
  const id = req.newuser;

  try {
    const { category, title, summary, content } = req.body;
    console.log(category)

    const markdowncontent = turndownService.turndown(content);

    if (req.file !== undefined && req?.file?.originalname.length > 0) {
      const filepath = await UploadOnCloudinary(req?.file?.path);
      const newBlog = new BlogModel({
        Author: id?._id,
        category,
        title,
        summary,
        file: filepath?.secure_url,
        content: markdowncontent,
      });

      await newBlog.save();

      const users = await Usermodel.find({ _id: { $ne: id?._id } });

      let emailArray = [];
      users.forEach((value) => {
        emailArray?.push(value?.email);
      });

      await SendAddBlogNotification(emailArray, title, newBlog?._id);

      return res
        .status(200)
        .send(new ApiResponse(200, newBlog, "Blog added successfully"));
      // throw new ApiResponse(200, newBlog, "Blog added successfully");
    } else {
      return res.send(new ApiError(400, "please select a File"));
    }
  } catch (error) {
    console.log(error.message);

    next(error);
  }
};

// update single blog data

const UpdateBlogdata = async (req, res, next) => {
  try {
    const { category, title, summary, content } = req.body;
    const id = req.params.id;
    console.log(req.file);
    console.log(id);
    if (req.file !== undefined && req?.file?.originalname.length > 0) {
      const filepath = await UploadOnCloudinary(req?.file?.path);
      const UpDateblog = await BlogModel.findByIdAndUpdate(id, {
        Author: id?.id,
        category,
        title,
        summary,
        file: filepath.secure_url,
        content,
      });

      return res
        .status(201)
        .send(new ApiResponse(200, UpDateblog, "blog Updated"));
    } else {
      console.log("mohit");
      const UpDateblog = await BlogModel.findByIdAndUpdate(id, {
        Author: id?.id,
        category,
        title,
        summary,
        content,
      });

      return res
        .status(201)
        .send(new ApiResponse(200, UpDateblog, "blog Updated "));
    }
  } catch (error) {
    next(error);
  }
};

//  delete blog
const DeleteBlogdata = async (req, res, next) => {
  const userid = req.newuser?._id;
  const id = req.params.id;

  try {
    const DeleteBlog = await BlogModel.findByIdAndDelete(id);
    await Usermodel.findByIdAndUpdate(
      { _id: userid },
      {
        $pull: {
          recentBlog: id,
          savedBlog: id,
        },
      },
      { new: true }
    );
    const obj = {};
    obj["type"] = DeleteBlog?.file.includes("video") ? "video" : "image";
    obj["publicid"] = DeleteBlog.file.split("/").pop().split(".")[0];

    if (obj.publicid !== undefined) {
      await cloudinary.uploader.destroy(obj.publicid, {
        resource_type: "image",
      });
    }
    return res
      .status(201)
      .send(new ApiResponse(200, DeleteBlog, "Blog Delete Successfully "));
  } catch (error) {
    next(error);
  }
};

const GetBlogbyId = async (req, res, next) => {
  const id = req.params.id;

  try {
    const blogdata = await BlogModel.findById(id).populate("Author", [
      "name",
      "email",
      "avatar",
    ]);

    return res
      .status(201)
      .send(new ApiResponse(200, blogdata, "single blog data  "));
  } catch (error) {
    next(error);
  }
};

// get  user blog data
const GetUserblogsdata = async (req, res, next) => {
  const id = req.newuser;

  try {
    const getuserblog = await BlogModel.find({ Author: id._id })
      .sort({
        createdAt: -1,
      })
      .populate("Author");
    return res
      .status(201)
      .send(new ApiResponse(200, getuserblog, "getuser blog"));
  } catch (error) {
    next(error);
  }
};

// getblog by category

const GetblogbyCategorys = async (req, res, next) => {
  const { category } = req.query;
  console.log(req.query);
  const value = category.split(",");
  console.log(category.split(","));

  try {
    const findblogbycategory = await BlogModel.find({
      category: { $in: value },
    });
    return res
      .status(201)
      .send(new ApiResponse(200, findblogbycategory, "getuser blog"));
  } catch (error) { 
    next(error);
  }
};

// get recent blog post
const checkandAddrecentblog = async (req, res, next) => {
  const userid = req.newuser._id;
  const blogid = req.params.id;

  console.log(userid, blogid);

  try {
    let user;
    user = await Usermodel.findOne({ _id: userid });

    if (!user) {
      return res.send(new ApiError(400, "user not found"));
    }

    // Check if the blog exists in recentBlog
    const existblog = user.recentBlog.includes(blogid);
    console.log(existblog);

    if (existblog) {
      // Pull the blog and then push it to the end of the recentBlog array
      user = await Usermodel.findByIdAndUpdate(
        { _id: userid },
        {
          $pull: {
            recentBlog: blogid,
          },
        },
        { new: true }
      );

      // Push it back to the array
      await Usermodel.findByIdAndUpdate(
        { _id: userid },
        {
          $push: {
            recentBlog: blogid,
          },
        },
        { new: true }
      );
    } else {
      // Push it directly if it doesn't exist
      await Usermodel.findByIdAndUpdate(
        { _id: userid },
        {
          $push: {
            recentBlog: blogid,
          },
        },
        { new: true }
      );
    }

    return res
      .status(201)
      .send(new ApiResponse(200, "", "Updated recent blogs successfully"));
  } catch (error) {
    next(error);
  }
};

// method to get recent blog data

const Getrecentblogdata = async (req, res, next) => {
  const userid = req.newuser._id;
  try {
    const blogdata = await Usermodel.findOne({ _id: userid }).populate(
      "recentBlog"
    );
    const recentblog = blogdata?.recentBlog;

    return res
      .status(201)
      .send(new ApiResponse(200, recentblog, "recent blog data "));
  } catch (error) {
    next(error);
  }
};

// saved blog data

const SavedBlog = async (req, res, next) => {
  const blogid = req.params.id;
  const userid = req.newuser._id;

  try {
    const checkExistBlog = await Usermodel.findOne({
      _id: userid,
      savedBlog: { $in: [blogid] }, // Use an array for $in
    });

    console.log(checkExistBlog);

    if (checkExistBlog) {
      // If blog exists, remove it
      const updatedUser = await Usermodel.findOneAndUpdate(
        { _id: userid },
        {
          $pull: { savedBlog: blogid }, // Use $pull to remove the blog
        },
        { new: true } // Ensure the updated document is returned
      ).populate("savedBlog");

      return res
        .status(200) // Use 200 for successful responses
        .send(
          new ApiResponse(
            200,
            updatedUser?.savedBlog,
            "Blog unsaved successfully"
          )
        );
    } else {
      // If blog does not exist, add it
      const updatedUser = await Usermodel.findOneAndUpdate(
        { _id: userid },
        {
          $push: { savedBlog: blogid }, // Use $push to add the blog
        },
        { new: true } // Ensure the updated document is returned
      ).populate("savedBlog");

      return res
        .status(200) // Use 200 for successful responses
        .send(
          new ApiResponse(
            200,
            updatedUser?.savedBlog,
            "Blog saved successfully"
          )
        );
    }
  } catch (error) {
    next(error);
  }
};

// get saved blog data
const GetSavedblogdata = async (req, res, next) => {
  const userid = req.newuser._id;
  try {
    const blogdata = await Usermodel.findOne({ _id: userid }).populate(
      "savedBlog"
    );

    const savedblogdata = blogdata.savedBlog;
    return res
      .status(201)
      .send(new ApiResponse(200, savedblogdata, "saved blog data "));
  } catch (error) {
    next(error);
  }
};

// like the blogs

const LikeAndDisliketheblog = async (req, res, next) => {
  const userid = req.newuser._id;
  const blogid = req.params.id;

  try {
    // check you already like this blog or not
    const checkLikeordislike = await BlogModel.findOne({
      _id: blogid,
      likes: { $in: userid },
    });
    console.log(checkLikeordislike);

    if (checkLikeordislike) {
      const updateblog = await BlogModel.findByIdAndUpdate(
        { _id: blogid },
        {
          $pull: {
            likes: userid,
          },
        },
        { new: true }
      );

      return res
        .status(201)
        .send(new ApiResponse(200, updateblog, "dislike the blog "));
    } else {
      const updateblog = await BlogModel.findByIdAndUpdate(
        { _id: blogid },
        {
          $push: {
            likes: userid,
          },
        },
        { new: true }
      );

      return res
        .status(201)
        .send(new ApiResponse(200, updateblog, "like the blog "));
    }
  } catch (error) {
    next(error);
  }
};

export {
  Getblogdata,
  PostBlogdata,
  UpdateBlogdata,
  DeleteBlogdata,
  GetUserblogsdata,
  Getrecentblogdata,
  GetBlogbyId,
  GetblogbyCategorys,
  checkandAddrecentblog,
  SavedBlog,
  GetSavedblogdata,
  LikeAndDisliketheblog,
};
