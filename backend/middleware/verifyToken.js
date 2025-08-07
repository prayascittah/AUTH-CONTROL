import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
   const token = req.cookies.token;
   // check if th token is there
   if (!token) {
      return res.status(401).json({
         message: "Unauthorized",
         success: false,
      })
   }
   try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); 

      // if they dont tally
      if (!decoded) {
         return res.status(401).json({
            message: "Unauthorized - invalid token",
            success: false,
         })
      }
      req.userId = decoded.userId;
      next();

   } catch (error) {
      console.log("Error in verifyToken", error);
      return res.status(500).json({
         message: "Server error",
         success: false,
      })
   }
}