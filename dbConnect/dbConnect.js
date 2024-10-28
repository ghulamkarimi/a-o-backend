import mongoose from 'mongoose';    

    export const dbConnect = async()=>{
    try {
      await  mongoose.connect(process.env.MONGO_url,{

      })
        console.log('Database connected')
    } catch (error) {
        console.log("Error in connecting to database")
    }
}