import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  qty: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  weight: { type: Number, default: 0, min: 0 },
  qom: { type: String, default: 'Pcs', trim: true },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, default: '', trim: true },
  customerAddress: { type: String, default: '', trim: true },
  items: [invoiceItemSchema],
  transport: { type: String, default: '' },
  chargeableValue: { type: Number, required: true, min: 0 },
  previousDue: { type: Number, default: 0, min: 0 },
  roundOff: { type: Number, default: 0 },
  originalGrandTotal: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  amountInWords: { type: String, default: '' },
  pay: { type: Number, default: 0, min: 0 },
  paymentHistory: [{
    amount: { type: Number, required: true },
    paidBy: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ['Paid', 'Partial', 'Unpaid', 'DueToNext'],
    default: 'Unpaid',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
