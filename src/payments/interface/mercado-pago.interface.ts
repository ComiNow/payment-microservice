export interface MercadoPagoPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  transaction_details: {
    net_received_amount: number;
    total_paid_amount: number;
    installment_amount: number;
  };
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  additional_info: {
    items: {
      id: string;
      title: string;
      quantity: string;
      unit_price: string;
    }[];
  };
  charges_details: {
    name: string;
    amounts: {
      original: number;
      refunded: number;
    };
    metadata?: {
      mov_detail?: string;
      mov_financial_entity?: string;
      mov_type?: string;
      source?: string;
      tax_id?: number;
      tax_status?: string;
      user_id?: number;
    };
  }[];
  fee_details: {
    amount: number;
    fee_payer: string;
    type: string;
  }[];
  payment_method: {
    id: string;
    type: string;
  };
  card?: {
    last_four_digits: string;
    expiration_month: number;
    expiration_year: number;
    cardholder: {
      name: string;
    };
  };
  metadata: {
    order_id: number;
    business_id: string;
  };
}