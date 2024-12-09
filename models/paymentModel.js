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
      ref: 'Car', // Verknüpfung mit Car-Modell
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Verknüpfung mit User-Modell
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['CREATED', 'PENDING', 'COMPLETED', 'FAILED'],
      default: 'CREATED',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    payer: { type: Object, default: {} },
    createTime: {
      type: Date,
    },
    updateTime: {
      type: Date,
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
