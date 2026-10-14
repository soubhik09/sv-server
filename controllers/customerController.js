import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    sendSuccess(res, customers);
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) throw new AppError('Customer not found', 404);
    sendSuccess(res, customer);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, gstin, email } = req.body;

    const existing = await Customer.findOne({ phone });
    if (existing) {
      throw new AppError('A customer with this phone already exists', 400);
    }

    const customer = await Customer.create({ name, phone, address, gstin, email });
    sendSuccess(res, customer, 201, 'Customer created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, gstin, email } = req.body;

    if (phone) {
      const existing = await Customer.findOne({ phone, _id: { $ne: req.params.id } });
      if (existing) {
        throw new AppError('A customer with this phone already exists', 400);
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, gstin, email },
      { new: true, runValidators: true }
    );
    if (!customer) throw new AppError('Customer not found', 404);

    sendSuccess(res, customer, 200, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    if (!customer) throw new AppError('Customer not found', 404);
    await Invoice.deleteMany({ customer: customerId });
    await Customer.findByIdAndDelete(customerId);
    sendSuccess(res, null, 200, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getCustomerInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.id }).sort({ date: -1 });
    sendSuccess(res, invoices);
  } catch (error) {
    next(error);
  }
};
