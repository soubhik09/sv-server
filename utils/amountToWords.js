const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const convertBelowThousand = (n) => {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertBelowThousand(n % 100) : '');
};

export const amountToWords = (num) => {
  if (isNaN(num) || num < 0) return 'Zero Rupees Only';

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  let words = '';
  if (crore) words += convertBelowThousand(crore) + ' Crore ';
  if (lakh) words += convertBelowThousand(lakh) + ' Lakh ';
  if (thousand) words += convertBelowThousand(thousand) + ' Thousand ';
  if (hundred) words += convertBelowThousand(hundred);

  words += ' Rupees';

  if (paise > 0) {
    words += ' and ' + convertBelowThousand(paise) + ' Paise';
  }

  words += ' Only';
  return words.trim().replace(/\s+/g, ' ');
};
