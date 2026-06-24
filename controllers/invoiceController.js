import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import { generateInvoiceNumber, peekNextInvoiceNumber } from '../utils/invoiceNumberGenerator.js';
import { amountToWords } from '../utils/amountToWords.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

const updateCustomerDue = async (customerId) => {
  if (!customerId) return;
  const invoices = await Invoice.find({ customer: customerId });
  const totalDue = invoices.reduce((sum, inv) => {
    if (inv.status === 'Unpaid') return sum + inv.grandTotal;
    if (inv.status === 'Partial') return sum + (inv.grandTotal - inv.pay);
    if (inv.status === 'DueToNext' || inv.status === 'Carry-Forward') return sum;
    return sum;
  }, 0);

  const dueHistory = invoices
    .filter((inv) => inv.status !== 'Paid' && inv.status !== 'DueToNext' && inv.status !== 'Carry-Forward')
    .map((inv) => ({
      invoiceId: inv._id,
      amount: inv.status === 'Partial' ? inv.grandTotal - inv.pay : inv.grandTotal,
      date: inv.date,
    }));

  await Customer.findByIdAndUpdate(customerId, { currentDue: totalDue, dueHistory });
};

export const getNextNumber = async (req, res, next) => {
  try {
    const nextNo = await peekNextInvoiceNumber();
    sendSuccess(res, { nextInvoiceNo: nextNo });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const { startDate, endDate, customer, status, search, page = 1, limit = 50 } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (customer) query.customer = customer;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { invoiceNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customer', 'name phone')
      .populate('carriedForwardTo', 'invoiceNo')
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name phone')
      .populate('carriedForwardTo', 'invoiceNo');
    if (!invoice) throw new AppError('Invoice not found', 404);
    sendSuccess(res, invoice);
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const {
      date, customer: customerId, customerName, customerPhone, customerAddress,
      items, transport, previousDue, roundOff, pay, chargeableValue, grandTotal,
      discount: incomingDiscount, originalGrandTotal: incomingOriginalGrandTotal,
    } = req.body;

    const invoiceNo = await generateInvoiceNumber();

    const originalGrandTotal = incomingOriginalGrandTotal || grandTotal || 0;
    let finalGrandTotal = grandTotal || 0;
    let discount = incomingDiscount || 0;

    if (discount > 0 && customerId) {
      const cust = await Customer.findById(customerId);
      const actualDiscount = Math.min(discount, cust?.creditBalance || 0);
      if (actualDiscount > 0) {
        await Customer.findByIdAndUpdate(customerId, { $inc: { creditBalance: -actualDiscount } });
        discount = actualDiscount;
        finalGrandTotal = Math.max(0, (grandTotal || 0));
      } else {
        discount = 0;
      }
    } else if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer && customer.creditBalance > 0) {
        discount = Math.min(customer.creditBalance, finalGrandTotal);
        finalGrandTotal = Math.max(0, finalGrandTotal - discount);
        await Customer.findByIdAndUpdate(customerId, { $inc: { creditBalance: -discount } });
      }
    }

    const words = amountToWords(finalGrandTotal || 0);

    let status = 'Unpaid';
    if (discount > 0 && finalGrandTotal === 0) status = 'Paid';
    else if ((pay || 0) > 0 && (pay || 0) >= finalGrandTotal) status = 'Paid';
    else if ((pay || 0) > 0) status = 'Partial';

    let finalPay = pay || 0;

    if (finalPay > finalGrandTotal) {
      const excess = finalPay - finalGrandTotal;
      finalPay = finalGrandTotal;
      status = 'Paid';
      if (customerId) {
        await Customer.findByIdAndUpdate(customerId, { $inc: { creditBalance: excess } });
      }
    }

    const invoice = await Invoice.create({
      invoiceNo,
      date: date || new Date(),
      customer: customerId || null,
      customerName,
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || '',
      items,
      transport: transport || '',
      chargeableValue: chargeableValue || 0,
      previousDue: previousDue || 0,
      roundOff: roundOff || 0,
      originalGrandTotal,
      discount,
      grandTotal: finalGrandTotal,
      amountInWords: words,
      pay: finalPay,
      status,
      createdBy: req.user._id,
    });

    if (finalPay > 0) {
      invoice.paymentHistory.push({ amount: finalPay, paidBy: req.user?.name || '', date: new Date() });
      await invoice.save();
    }

    if (customerId && (previousDue || 0) > 0) {
      const oldInvoices = await Invoice.find({
        customer: customerId,
        _id: { $ne: invoice._id },
        status: { $in: ['Unpaid', 'Partial'] },
      }).sort({ date: 1, createdAt: 1 });

      let remaining = previousDue;
      for (const old of oldInvoices) {
        if (remaining <= 0) break;
        const oldDue = old.status === 'Partial' ? old.grandTotal - old.pay : old.grandTotal;
        if (oldDue <= remaining) {
          old.status = 'Carry-Forward';
          old.pay = old.grandTotal;
          old.carriedForwardTo = invoice._id;
          remaining -= oldDue;
        } else {
          old.pay = (old.pay || 0) + remaining;
          old.status = old.pay >= old.grandTotal ? 'Paid' : 'Partial';
          remaining = 0;
        }
        await old.save();
      }
    }

    if (customerId) {
      await updateCustomerDue(customerId);
    }

    sendSuccess(res, invoice, 201, 'Invoice created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new AppError('Invoice not found', 404);

    const {
      date, customer: customerId, customerName, customerPhone, customerAddress,
      items, transport, previousDue, roundOff, pay, paidBy, chargeableValue, grandTotal,
    } = req.body;

    const words = amountToWords(grandTotal || 0);
    let status = 'Unpaid';
    if (pay > 0 && pay >= grandTotal) status = 'Paid';
    else if (pay > 0) status = 'Partial';

    const oldCustomerId = invoice.customer;

    const payChanged = pay !== undefined && pay !== invoice.pay;
    const payDiff = payChanged ? (pay || 0) - invoice.pay : 0;

    let finalPay = pay || 0;

    if (payChanged && payDiff > 0 && grandTotal && finalPay > grandTotal) {
      const excess = finalPay - grandTotal;
      finalPay = grandTotal;
      status = 'Paid';
      if (customerId) {
        await Customer.findByIdAndUpdate(customerId, { $inc: { creditBalance: excess } });
      }
    }

    const actualPayAdded = finalPay - invoice.pay;

    Object.assign(invoice, {
      date: date || invoice.date,
      customer: customerId || null,
      customerName,
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || '',
      items,
      transport: transport || '',
      chargeableValue: chargeableValue || 0,
      previousDue: previousDue || 0,
      roundOff: roundOff || 0,
      grandTotal: grandTotal || 0,
      amountInWords: words,
      pay: finalPay,
      status,
    });

    if (actualPayAdded > 0) {
      invoice.paymentHistory.push({ amount: actualPayAdded, paidBy: paidBy || '', date: new Date() });
    }

    await invoice.save();

    if (customerId) await updateCustomerDue(customerId);
    if (oldCustomerId && String(oldCustomerId) !== String(customerId)) {
      await updateCustomerDue(oldCustomerId);
    }

    sendSuccess(res, invoice, 200, 'Invoice updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new AppError('Invoice not found', 404);

    const customerId = invoice.customer;
    await Invoice.findByIdAndDelete(req.params.id);

    if (customerId) {
      await updateCustomerDue(customerId);
    }

    sendSuccess(res, null, 200, 'Invoice deleted successfully');
  } catch (error) {
    next(error);
  }
};
