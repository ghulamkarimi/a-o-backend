import mongoose from 'mongoose';

export const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Error in connecting to database:', error.message);
    process.exit(1); 
  }
};
