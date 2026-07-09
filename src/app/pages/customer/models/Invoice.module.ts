export type InvoiceStatus = 'ACTIVE' | 'VOID';

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  orderId: number;
  customerId: number;
  customerName: string;
  customerCompany: string;
  vendorId: number;
  vendorCompanyName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  deliveryFee?: number; // optional — only if backend team added it to InvoiceResponse
  totalAmount: number;
  shippingAddress: string;
  issuedAt: string;
  status: InvoiceStatus;
  voidedAt: string | null;
}
