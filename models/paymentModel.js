import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true, // Bestell-ID muss einzigartig sein
    },
    customerEmail: {
      type: String,
      required: true,
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car', // Annahme, dass du ein Car-Modell hast
      required: true,
    },
    userId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['CREATED', 'PENDING', 'COMPLETED', 'FAILED'],
      default: 'CREATED',
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
