import cuid from 'cuid';

export default function generateCuid(input) {
  let cuidInput = input;
  if (!input.id) {
    const id = cuid();
    // Set id as input field.
    cuidInput = { ...input, id };
  }
  return cuidInput;
}
