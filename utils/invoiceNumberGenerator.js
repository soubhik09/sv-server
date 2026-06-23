import Settings from '../models/Settings.js';

export const generateInvoiceNumber = async () => {
  const settings = await Settings.findOne();
  if (!settings) {
    throw new Error('Settings not found');
  }

  let prefix = settings.invoicePrefix || 'INV';
  let nextNum = settings.invoiceNextNumber || 1;

  if (settings.invoiceYearlyReset) {
    const year = new Date().getFullYear();
    prefix = `${prefix}-${year}`;
  }

  const invoiceNo = `${prefix}-${String(nextNum).padStart(4, '0')}`;

  settings.invoiceNextNumber = nextNum + 1;
  await settings.save();

  return invoiceNo;
};

export const peekNextInvoiceNumber = async () => {
  const settings = await Settings.findOne();
  if (!settings) return 'INV-0001';

  let prefix = settings.invoicePrefix || 'INV';
  let nextNum = settings.invoiceNextNumber || 1;

  if (settings.invoiceYearlyReset) {
    const year = new Date().getFullYear();
    prefix = `${prefix}-${year}`;
  }

  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
};
