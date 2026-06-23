import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, default: '', trim: true },
  gstin: { type: String, default: '', trim: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  currentDue: { type: Number, default: 0 },
  creditBalance: { type: Number, default: 0 },
  dueHistory: [{
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  }],
});

customerSchema.index({ phone: 1 }, { unique: true });

export default mongoose.model('Customer', customerSchema);
