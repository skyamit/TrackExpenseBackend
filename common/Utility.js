const {
  startOfToday,
  addDays,
  addMonths,
  addWeeks,
  addYears,
} = require("date-fns");

const decrypt = (salt, encoded) => {
  const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
  const applySaltToChar = (code) =>
    textToChars(salt).reduce((a, b) => a ^ b, code);
  return encoded
    .match(/.{1,2}/g)
    .map((hex) => parseInt(hex, 16))
    .map(applySaltToChar)
    .map((charCode) => String.fromCharCode(charCode))
    .join("");
};

function getNextPaymentDate(recurrenceType, lastDate) {
  let nextDate = new Date(lastDate);
  switch (recurrenceType) {
    case "daily":
      return addDays(nextDate, 1);
    case "weekly":
      return addWeeks(nextDate, 1);
    case "monthly":
      return addMonths(nextDate, 1);
    case "yearly":
      return addYears(nextDate, 1);
    default:
      return null;
  }
};

module.exports = {getNextPaymentDate}