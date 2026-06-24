import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import { sendSuccess } from '../utils/response.js';

export const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    const match = Object.keys(dateFilter).length
      ? { date: dateFilter, status: { $ne: 'Carry-Forward' } }
      : { status: { $ne: 'Carry-Forward' } };

    const [salesData, customerData, outstandingData] = await Promise.all([
      Invoice.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
            totalCollection: { $sum: '$pay' },
            totalInvoices: { $sum: 1 },
            paidInvoices: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] } },
            unpaidInvoices: { $sum: { $cond: [{ $eq: ['$status', 'Unpaid'] }, 1, 0] } },
            partialInvoices: { $sum: { $cond: [{ $eq: ['$status', 'Partial'] }, 1, 0] } },
          },
        },
      ]),
      Customer.aggregate([
        { $group: { _id: null, totalCustomers: { $sum: 1 }, totalDue: { $sum: '$currentDue' } } },
      ]),
      Invoice.aggregate([
        { $match: { status: { $in: ['Unpaid', 'Partial'] }, ...match } },
        {
          $group: {
            _id: null,
            totalOutstanding: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'Partial'] },
                  { $subtract: ['$grandTotal', '$pay'] },
                  '$grandTotal',
                ],
              },
            },
          },
        },
      ]),
    ]);

    const sales = salesData[0] || { totalSales: 0, totalCollection: 0, totalInvoices: 0 };
    const customers = customerData[0] || { totalCustomers: 0, totalDue: 0 };
    const outstanding = outstandingData[0] || { totalOutstanding: 0 };

    sendSuccess(res, {
      totalSales: sales.totalSales,
      totalCollection: sales.totalCollection,
      totalInvoices: sales.totalInvoices,
      paidInvoices: sales.paidInvoices,
      unpaidInvoices: sales.unpaidInvoices,
      partialInvoices: sales.partialInvoices,
      totalCustomers: customers.totalCustomers,
      totalDue: customers.totalDue,
      totalOutstanding: outstanding.totalOutstanding,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate + 'T23:59:59.999Z');
    const match = Object.keys(dateFilter).length
      ? { date: dateFilter, status: { $ne: 'Carry-Forward' } }
      : { status: { $ne: 'Carry-Forward' } };

    let format;
    if (groupBy === 'year') format = { $dateToString: { format: '%Y', date: '$date' } };
    else if (groupBy === 'month') format = { $dateToString: { format: '%Y-%m', date: '$date' } };
    else if (groupBy === 'week') format = { $dateToString: { format: '%Y-W%V', date: '$date' } };
    else format = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };

    const trends = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: format,
          sales: { $sum: '$grandTotal' },
          collection: { $sum: '$pay' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    sendSuccess(
      res,
      trends.map((t) => ({ date: t._id, sales: t.sales, collection: t.collection, count: t.count }))
    );
  } catch (error) {
    next(error);
  }
};

export const getExport = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    let query = { status: { $ne: 'Carry-Forward' } };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    if (status && status !== 'Carry-Forward') query.status = status;

    const invoices = await Invoice.find(query)
      .populate('customer', 'name phone')
      .sort({ date: -1 });

    const data = invoices.map((inv, i) => ({
      _id: inv._id,
      'Sl No': i + 1,
      'Invoice No': inv.invoiceNo,
      Date: inv.date ? inv.date.toISOString().split('T')[0] : '',
      Customer: inv.customerName,
      'Grand Total': inv.grandTotal,
      'PAY Received': inv.pay,
      'Previous Due': inv.previousDue,
      Status: inv.status,
    }));

    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
