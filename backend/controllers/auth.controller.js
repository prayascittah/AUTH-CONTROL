// external import
import bcrypt from "bcryptjs";
import crypto from "crypto";

// internal import
import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie, generateVerificationToken } from "../utils/manyUtility.js";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } from "../mailtrap/emails.js";

export const signup = async(req, res) => {
   const { email, password, name} = req.body;
   try {
      if (!email || !password || !name) {
         throw new Error("All fields are required")
      }

      const userAlreadyExists = await User.findOne({email});

      if (userAlreadyExists) {
         return res.status(400).json({
            message: "User already exists",
            success: false,
         })
      }

      const hashedPassword = await bcrypt.hash(password, 5);

      // make the verification code
      const verificationToken = generateVerificationToken();
      // time to send the user to the db
      const user = new User({
         email, 
         password: hashedPassword, 
         name,
         verificationToken,
         verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // in ms

      })

      await user.save();

      // get the jwt token
      generateTokenAndSetCookie(res, user._id);

      // after the saving the user and generating the cookie
      // we can send the email:
      await sendVerificationEmail(user.email, verificationToken)

      res.status(201).json({
         message: "User created successfully",
         success: true,
         user: {
            ...user._doc,
            password: undefined,
         }
      });


   } catch(error) {
      res.status(400).json({
         message: error.message,
         success: false,
      })
   } finally {

   }
}

export const verifyEmail = async(req, res) => {
   // this end point will be reached once the user enters the ------ 
   // the six digit code and enters the submit 
   // so we need the verifi-token and the user otp to keep going

   // code is the user sent
   const { code } = req.body;
   try {
      const user = await User.findOne({
         verificationToken: code,
         verificationTokenExpiresAt: { $gt: Date.now() }
      });

      if (!user) {
         return res.status(400).json({
            success: false, 
            message: "Invalid or expired verification code"
         })
      }

      // else the user is found
      user.isVerified = true;
      // the values of the verificatio token is being reset
      user.verificationToken = undefined;
      user.verificationTokenExpiresAt = undefined;
      await user.save();

      // greet the user :)
      await sendWelcomeEmail(user.email, user.name);

      res.status(200).json({
         success: true,
         message: "Email verfied successfully",
         user: {
            ...user._doc,
            password: undefined,
         }
      });
   } catch(error) {
      console.log("error in verifyEmail ", error);
		res.status(500).json({ 
         success: false, 
         message: "Server error" 
      });
   }
}

export const login = async(req, res) => {
   const { email, password } = req.body;
	try {
		const user = await User.findOne({ email });
      // no such user exists
		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}

      // ooh yes we found the user
		const isPasswordValid = await bcrypt.compare(password, user.password);

      // duude the password is wrong
		if (!isPasswordValid) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}

      // okay the password is right
      // lets go and generate the cookie
		generateTokenAndSetCookie(res, user._id);


      // save the user to the db, but before that add the lastLogin we need that right
		user.lastLogin = new Date();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("Error in login ", error);
		res.status(400).json({ success: false, message: error.message });
	}
}

export const logout = async(req, res) => {
   res.clearCookie("token");
   res.status(200).json({ success: true, message: "Logged out successfully" });
}

export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
      // find the user
		const user = await User.findOne({ email });

      // if there is no user;
		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

      // If the user is there;
		// Generate reset token
		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

      // update the user
		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		await user.save();

		// send email
		await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

		res.status(200).json({ 
         success: true, 
         message: "Password reset link sent to your email" 
      });
	} catch (error) {
		console.log("Error in forgotPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const resetPassword = async(req, res) => {
   // take the password from the req.body
   try {
      const { token } = req.params;
      const { password } = req.body;

      // find the user with the same token, claims to reset password outside the scope of the auth
      // hence we need a field to verify that the person we are taking about is the same person
      // the validity of the token should be in the future because else the time ran out and then i dont want to allow the user to change the password 
      const user = await User.findOne({
         resetPasswordToken: token,
         resetPasswordExpiresAt: {$gt: Date.now()},
      })

      if (!user) {
         return res.status(400).json({
            success: false,
            message: "Invalid or expired reset token"
         })
      }

      // update password
      const hashedPassword = await bcrypt.hash(password, 5);

      user.password = hashedPassword;
      // cant have a reset password field unless they ask for the forgot password checkpoint
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiresAt = undefined;

      // just the save the user
      await user.save();

      await sendResetSuccessEmail(user.email);

      // all done
      res.status(200).json({
         message: "Password reset successful",
         success: true,
      })
   } catch (error) {
      console.log("Error in the resetPassword ", error);
      res.status(400).json({
         message: error.message,
         success: false,
      })
   }
}

export const checkAuth = async(req, res) => {
   try {
      const user = await User.findById(req.userId).select("-password");
      // if the user does not exist
      if (!user) {
         return res.status(400).json({ 
            message: "User not found",
            success: false, 
         });
      }

      res.status(200).json({
         user,
         success: true,
      })
   } catch(error) {
      console.log("Erro in checkAuth", error);
      res.status(400).json({
         message: error.message, 
         success: false,
      })
   }
}
