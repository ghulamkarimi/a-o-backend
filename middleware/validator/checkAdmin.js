// Desc: Middleware to check if user is admin
import User from "../../models/userModel.js";


export const checkAdmin = async (userId) => {
    try {
        const user = await User.findById(userId);
        if(!user) throw new Error('User not found');
        if(!user.isAdmin){
            throw new Error('You are not authorized to perform this action');
        }
        return user;
    } catch (error) {
        console.log(" Error in checkAdmin",error.message);
        throw new Error(error.message);
    }
}

