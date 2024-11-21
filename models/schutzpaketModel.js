import mongoose from "mongoose"



const SchutzPacketSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, 
      },
      deductible: {
        type: Number,
        required: true, 
      },
      dailyRate: {
        type: Number,
        required: true,
      },
      features: {
        type: [String],
        required: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
})


export default mongoose.model("SchutzPacket",SchutzPacketSchema)