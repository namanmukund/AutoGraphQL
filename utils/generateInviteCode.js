import voucherCode from 'voucher-code-generator';

const generateInviteCode = () => {
  const code = voucherCode.generate({
    length: 8,
    count: 1,
  });
  return code[0];
};

export default generateInviteCode;
