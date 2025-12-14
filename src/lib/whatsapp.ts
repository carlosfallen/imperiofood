// FILE: src/lib/whatsapp.ts
export interface WhatsAppOrder {
  orderType: string;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPostalCode?: string;
  items: Array<{
    name: string;
    size?: string;
    flavor?: string;
    addons: string[];
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee?: number;
  total: number;
  paymentMethod?: string;
  notes?: string;
}

export function generateWhatsAppMessage(order: WhatsAppOrder): string {
  let message = '🍕 *NOVO PEDIDO - IMPÉRIO PIZZAS*\n\n';
  
  if (order.orderType === 'internal') {
    message += `📍 *Origem:* Pedido Interno – Mesa ${order.tableNumber}\n\n`;
  } else if (order.orderType === 'delivery') {
    message += `📍 *Origem:* Pedido Externo (Delivery)\n\n`;
  } else {
    message += `📍 *Origem:* Pedido Externo (Retirada)\n\n`;
  }
  
  if (order.customerName) {
    message += `👤 *Cliente:* ${order.customerName}\n`;
  }
  
  if (order.customerPhone) {
    message += `📞 *Telefone:* ${order.customerPhone}\n`;
  }
  
  if (order.customerAddress) {
    message += `📍 *Endereço:* ${order.customerAddress}\n`;
    if (order.customerPostalCode) {
      message += `📮 *CEP:* ${order.customerPostalCode}\n`;
    }
  }
  
  message += '\n*ITENS DO PEDIDO:*\n\n';
  
  order.items.forEach((item, index) => {
    message += `${index + 1}. *${item.name}*\n`;
    if (item.size) message += `   Tamanho: ${item.size}\n`;
    if (item.flavor) message += `   Sabor: ${item.flavor}\n`;
    if (item.addons.length > 0) {
      message += `   Adicionais: ${item.addons.join(', ')}\n`;
    }
    message += `   Quantidade: ${item.quantity}x\n`;
    message += `   Valor: R$ ${item.price.toFixed(2)}\n\n`;
  });
  
  message += `💰 *Subtotal:* R$ ${order.subtotal.toFixed(2)}\n`;
  
  if (order.deliveryFee && order.deliveryFee > 0) {
    message += `🚚 *Taxa de Entrega:* R$ ${order.deliveryFee.toFixed(2)}\n`;
  }
  
  message += `✨ *TOTAL:* R$ ${order.total.toFixed(2)}\n\n`;
  
  if (order.paymentMethod) {
    message += `💳 *Forma de Pagamento:* ${order.paymentMethod}\n\n`;
  }
  
  if (order.notes) {
    message += `📝 *Observações:* ${order.notes}\n\n`;
  }
  
  message += '---\n_Pedido realizado pelo sistema Império Pizzas_';
  
  return message;
}

export function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}