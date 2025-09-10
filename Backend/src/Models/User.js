import mongoose from "mongoose";

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
        required: [true,"password is required"],
        minLength:[8,"password must be at least 8 characters"],
        select: false
    },
    profilePic: {
        type: String
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

const User = mongoose.model("User", userSchema);
export default User;
