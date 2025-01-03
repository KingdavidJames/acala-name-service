import mongoose from 'mongoose'
import dotenv from "dotenv"

dotenv.config()
const mongoUri = process.env.MONGODB_URI
// console.log(mongoUri)
// mongoose database connection
const connectDB = async ()=>{
    try{
        const conn = await mongoose.connect(mongoUri)
        console.log(`MongoDB connected: ${conn.connection.host}`)
    }
    catch(error){
        console.log(`Error: ${error.message}`)
        process.exit(1)
    }
}

export default connectDB