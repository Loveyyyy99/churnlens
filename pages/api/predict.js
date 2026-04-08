// pages/api/predict.js
import { predictChurn } from '../../lib/churnEngine';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer, industry = 'telecom' } = req.body;

    if (!customer) {
      return res.status(400).json({ error: 'Customer data required' });
    }

    // Validate required fields
    const required = ['tenure', 'monthlyCharges', 'contractType'];
    const missing = required.filter(f => customer[f] === undefined || customer[f] === '');
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    }

    // Coerce numeric fields
    const normalized = {
      ...customer,
      tenure: Number(customer.tenure),
      monthlyCharges: Number(customer.monthlyCharges),
      totalCharges: Number(customer.totalCharges) || Number(customer.monthlyCharges) * Number(customer.tenure),
      numServices: Number(customer.numServices) || 1,
    };

    const result = predictChurn(normalized, industry);

    return res.status(200).json({
      success: true,
      customer: normalized,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Predict API error:', err);
    return res.status(500).json({ error: 'Prediction failed', details: err.message });
  }
}
