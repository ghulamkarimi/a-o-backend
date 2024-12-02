import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    oldPrice: {
        type: Number,
        required: true,
    },
    newPrice: {
        type: Number,
        required: true,
    },
    discountPercentage: { 
        type: Number,
        default: 0,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
} ,
{
    timestamps: true,
}
);


offerSchema.pre('save', function(next) {
    if (this.oldPrice && this.newPrice && this.oldPrice > this.newPrice) {
        const discount = ((this.oldPrice - this.newPrice) / this.oldPrice) * 100;
        this.discountPercentage = Math.round(discount); 
    } else {
        this.discountPercentage = 0; 
    }
    next();
});

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
