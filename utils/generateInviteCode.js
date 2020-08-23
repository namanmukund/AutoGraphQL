import voucherCode from 'voucher-code-generator';

const generateInviteCode = (length = 8) => {
  const code = voucherCode.generate({
    length,
    count: 1,
  });
  return code[0];
};

export default generateInviteCode;
