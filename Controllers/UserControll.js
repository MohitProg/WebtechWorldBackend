import Usermodel from "../Modals/Usermodel.js";
import { check, validationResult } from "express-validator";
import { ApiError } from "../Utils/ApiError.js";
import { UploadOnCloudinary } from "../Utils/Cloudinary.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { SendWelcomeMail } from "../Middleware/SendMail.js";

//  signup User

const SigninUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.send({ success: "false", message: errors.array() });
  }

  try {
    const existuser = await Usermodel.findOne({ $and: [{ name }, { email }] });

    if (existuser) {
      return res.send(new ApiError(409, "User with name already exist"));
    }

    let User = new Usermodel({
      name,
      email,

      password,
    });
    await User.save();

    //  method to generate a otp
    const getRandomFourDigitNumber = () => {
      return Math.floor(1000 + Math.random() * 9000);
    };

    const otp = getRandomFourDigitNumber();
    console.log(otp);

    User.verifyCode = otp;
    User.save({ validateBeforeSave: true });
    await SendWelcomeMail(email, otp, name);
    return res
      .status(201)
      .send(new ApiResponse(200, "Otp is Send to your email"));
  } catch (error) {
    next(error);
  }
};

//  login user

const LoginUser = async (req, res, next) => {
  const { email, password } = req.body;

 

  try {
    const existuser = await Usermodel.findOne({ email });

    if (!existuser) {
      return res.send(new ApiError(400, "user doesn't exit"));
    }

    const passwordVerify = await existuser.isCorrectpassword(password);

    if (!passwordVerify) {
      return res.send(new ApiError(400, "Enter correct password"));
    }

    const token = await existuser.generateAccessToken();
    if (!token) {
      return res.send(new ApiError(401, "Invalid credencials"));
    }

    existuser.refreshToken = token;
    await existuser.save({ validateBeforeSave: false });

    const loggedInUser = await Usermodel.findById(existuser._id).select(
      "-password "
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", token, options)
      .json(new ApiResponse(200, loggedInUser, "user login successfully"));
  } catch (error) {
    next(error);
  }
};

// logout user functionality

const LogoutUser = async (req, res, next) => {
  const userid = req.newuser._id;

  try {
    await Usermodel.findByIdAndUpdate(
      { _id: userid },
      {
        $set: {
          refreshToken: null,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .clearCookie("accessToken")
      .json(new ApiResponse(200, "", "User logged out successfully"));
  } catch (error) {
    next(error);
  }
};
//  route for hanlde otp verifications
//  update user
const updateUser = async (req, res, next) => {
  console.log(req.file);
  try {
    const { name, desc, file } = req.body;
    const id = req.newuser;

    if (req.file === undefined) {
      const updateuser = await Usermodel.findByIdAndUpdate(
        id._id,
        {
          $set: {
            name,
            desc,
          },
        },
        { new: true }
      );
      console.log(updateuser);
      return res
        .status(201)
        .json(new ApiResponse(200, updateuser, "User updated successfully123"));
    } else if (req.file !== undefined) {
      const { originalname, path } = req.file;
      const avatar = await UploadOnCloudinary(path);

      if (!avatar) {
        return res.status(401).send(new ApiError(401, "photo not uploaded"));
      }
      const updateuser = await Usermodel.findByIdAndUpdate(
        id._id,
        {
          $set: {
            id,
            name,
            desc,
            avatar: avatar.secure_url,
          },
        },
        { new: true }
      );

      return res
        .status(201)
        .json(new ApiResponse(200, updateuser, "User updated successfully"));
    }
  } catch (error) {
    next(error);
  }
};

//  delete User
const deleteUser = async (req, res, next) => {
  const id = req.newuser;

  try {
    await Usermodel.findByIdAndDelete(id._id);

    if (!deleteUser) {
      return res.send({ success: false, message: "user Doesn't Delete" });
    }

    return res
      .status(201)
      .json(new ApiResponse(200, "user delete successfully"));
  } catch (error) {
    next(error);
  }
};

//  get user data

const getUserdata = async (req, res, next) => {
  const id = req.newuser;

  try {
    if (!id) {
      return res.send({ success: false, message: "Internal Server error" });
    }

    const userdata = await Usermodel.findById(id._id);
    return res.status(201).json(new ApiResponse(200, userdata, "getuserdata"));
  } catch (error) {
    next(error);
  }
};

// controler to verify account
const VerifyAccount = async (req, res, next) => {
  try {
    const { verifyCode } = req.body;
    console.log(verifyCode);

    //  lets find user here
    const user = await Usermodel.findOne({ verifyCode: verifyCode });

    if (!user) {
      return res.send(new ApiError(400, "Invalid Otp"));
    }
    const token = await user.generateAccessToken();
    user.isVerfiy = true;
    user.refreshToken = token;
    user.verifyCode = null;
    user.save({ validateBeforeSave: true });
    return res
      .status(201)
      .json(new ApiResponse(200, user, "opt is verify successfully"));
  } catch (error) {
    next(error);
  }
};

// method to resend opt and expire it in some second

export {
  SigninUser,
  LoginUser,
  VerifyAccount,
  updateUser,
  deleteUser,
  getUserdata,
  LogoutUser,
};
