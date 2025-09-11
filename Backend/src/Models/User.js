import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import  {ApiResponse}  from "../utils/ApiResponse.js";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true,"username is required"],
        trim:true,
        minLength:[3,"username must be at least 3 characters"]
    },
    email: {
        type: String,
        required:[true,"email is required"] ,
        unique: true,
        lowercase:true,
        trim:true,
        match:[/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please fill a valid email address"]
    },
    password: {
        type: String,
        required: function() {
            return !this.isGoogleUser;
        },
        minLength: [6, "Password must be at least 6 characters"],
        select: false // Don't send password in queries by default
    },
    profilePicture: {
        type: String,
        default:""
    },
    googleId:{
        type:String,
        sparse:true,
        unique:true
    },
    isGoogleUser:{
        type:Boolean,
        default:false,
    },

    //For authentication via OTP
    refreshToken:{
        type:String,
        select:false
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    privacy: {
        type: String,
        enum: ["public", "private", "friends"],
        default: "friends"
    }
}, { timestamps: true });

//hash password before saving the user
userSchema.pre("save",async function name(next) {
    if(!this.isModified("password")){
        return next();
    }
    try {
        const salt =await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password,salt);
        next();
    } catch (error) {
        next(error)
    }
})
// Method to compare password
userSchema.methods.comparePassword=async function name(candidatePassword){
    try {
       return await bcrypt.compare(candidatePassword,this.password); 
    } catch (error) {
        throw new ApiResponse(500,"Server Error");
        
    } 
    
}
//Methode to genrate jwt token
userSchema.methods.generateToken = function () {
    return jwt.sign(
        {
            userId:this._id,
            role:this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    );
}
// Method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            userId:this._id,
            role:this.role
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}

const User = mongoose.model("User", userSchema);
export default User;
