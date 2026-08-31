import bcrypt from 'bcryptjs';

const getUserPasswordObject = (password) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return {
    password: hash,
  };
};

export default getUserPasswordObject;
