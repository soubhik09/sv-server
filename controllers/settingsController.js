import Settings from '../models/Settings.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { companyName, proprietor, phone, email, address, invoicePrefix, invoiceYearlyReset } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (companyName !== undefined) settings.companyName = companyName;
    if (proprietor !== undefined) settings.proprietor = proprietor;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    if (address !== undefined) settings.address = address;
    if (invoicePrefix !== undefined) settings.invoicePrefix = invoicePrefix;
    if (invoiceYearlyReset !== undefined) settings.invoiceYearlyReset = invoiceYearlyReset;

    await settings.save();
    sendSuccess(res, settings, 200, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
};

export const resetInvoiceCounter = async (req, res, next) => {
  try {
    const settings = await Settings.findOne();
    if (settings) {
      settings.invoiceNextNumber = 1;
      await settings.save();
    }
    sendSuccess(res, null, 200, 'Invoice counter reset to 1');
  } catch (error) {
    next(error);
  }
};
