import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  items: {
    type: [saleItemSchema],
    required: true
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

saleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);

export default Sale;

