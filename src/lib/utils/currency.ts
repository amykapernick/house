export const formatCurrency = (value: number) => value.toLocaleString(`en-AU`, { style: `currency`, currency: `AUD` });
