import 'dotenv/config';

const payload = {
    externalId: 'trx_' + Math.random().toString(36).substring(2, 10),
    callbackUrl: 'https://ais-dev.run.app/api/webhooks/plinqpay',
    method: 'REFERENCE',
    client: {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '+244923000000'
    },
    items: [
      {
        title: 'Pacote 1',
        price: 8500,
        quantity: 1
      }
    ],
    amount: 8500
};
fetch('https://api.plinqpay.com/v1/transaction', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-key': process.env.PLINQPAY_API_KEY
  },
  body: JSON.stringify(payload)
}).then(r => r.json().then(data => console.log(r.status, JSON.stringify(data, null, 2))));
