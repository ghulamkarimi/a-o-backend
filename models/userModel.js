import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    
  },
  profile_photo: {
    type: String
  },
  refreshToken: {
    type: String,
  },
  isAccountVerified:{
    type: Boolean,
    default: false,
  },
  verificationCode :{
    type: String,
  },
},
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatch = async function (enteredPassword) {
  this.password = await bcrypt.compare(enteredPassword, this.password);
  return this.password;
};

const User = mongoose.model("User", userSchema);
export default User;
