import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   email: {
      type: String,
      required: true,
      unique: true,
   },
   password: {
      type: String,
      required: true,
   },
   name: {
      type: String,
      required: true,
   },
   lastLogin: {
      type: Date,
      default: Date.now(),
   }, 
   isVerified: {
      type: Boolean,
      default: false,
   },
   resetPasswordToken: String, // used when we want to update the value
   resetPasswordExpiresAt: Date, // after how much time does it expire
   verificationToken: String, // for the purpose of verifying the account
   verificationTokenExpiresAt: Date, // after how much time it expires
}, {
   timestamps: true
});

// by the use of the timout function the createat and the updateat fields will be automatically added into the document

// the User model follows the userSchema
export const User = mongoose.model('User', userSchema);