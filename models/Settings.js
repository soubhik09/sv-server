import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Siddhi Vinayak Enterprise' },
  proprietor: { type: String, default: 'Ananda Jana' },
  phone: { type: String, default: '9830695943 / 8282079896' },
  email: { type: String, default: 'siddhivinayakenterprise@gmail.com' },
  address: { type: String, default: 'Burasanti, Singur, Hooghly - 712409' },
  invoicePrefix: { type: String, default: 'INV' },
  invoiceYearlyReset: { type: Boolean, default: false },
  invoiceNextNumber: { type: Number, default: 1 },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
