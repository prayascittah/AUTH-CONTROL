import mongoose from 'mongoose';

export const connectDB = async() => {
   try {
      const conn = await mongoose.connect(process.env.MONGOOSE_URI);
      console.log(`MongoDb Connected: ${conn.connection.host}`);
   } catch (error) {
      console.log("Error connection to MongoDB:", error.message);
      process.exit(1) // 1-> failure, and 2 -> success
   }
}