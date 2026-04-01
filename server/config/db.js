import mongoose from "mongoose";


export const connectDB = async () => {
         try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("Connected to Database");
         } catch (error) {
            console.error("Error connecting to Database:", error);
         }
}