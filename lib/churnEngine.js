// lib/churnEngine.js
// Logistic-regression-style scoring engine with industry-specific weights

export const INDUSTRIES = {
  telecom: {
    label: 'Telecom',
    features: ['tenure', 'monthlyCharges', 'totalCharges', 'contractType', 'internetService', 'techSupport', 'onlineSecurity', 'numServices'],
    weights: {
      tenure: -0.045,
      monthlyCharges: 0.018,
      totalCharges: -0.0005,
      contractType: { 'Month-to-month': 0.9, 'One year': -0.3, 'Two year': -0.8 },
      internetService: { 'Fiber optic': 0.4, 'DSL': -0.1, 'No': -0.6 },
      techSupport: { 'Yes': -0.35, 'No': 0.35, 'No internet service': 0 },
      onlineSecurity: { 'Yes': -0.4, 'No': 0.4, 'No internet service': 0 },
      numServices: -0.12,
    },
    bias: 0.3,
    avgChurnRate: 26.5,
    benchmarks: { tenure: 24, monthlyCharges: 65 },
  },
  banking: {
    label: 'Banking',
    features: ['tenure', 'monthlyCharges', 'totalCharges', 'contractType', 'numServices', 'techSupport'],
    weights: {
      tenure: -0.038,
      monthlyCharges: 0.012,
      totalCharges: -0.0003,
      contractType: { 'Month-to-month': 0.7, 'One year': -0.2, 'Two year': -0.7 },
      internetService: { 'Fiber optic': 0.1, 'DSL': 0.1, 'No': -0.1 },
      techSupport: { 'Yes': -0.3, 'No': 0.25, 'No internet service': 0 },
      onlineSecurity: { 'Yes': -0.3, 'No': 0.3, 'No internet service': 0 },
      numServices: -0.15,
    },
    bias: 0.2,
    avgChurnRate: 15.8,
    benchmarks: { tenure: 36, monthlyCharges: 45 },
  },
  saas: {
    label: 'SaaS',
    features: ['tenure', 'monthlyCharges', 'totalCharges', 'contractType', 'numServices', 'techSupport'],
    weights: {
      tenure: -0.05,
      monthlyCharges: 0.022,
      totalCharges: -0.0004,
      contractType: { 'Month-to-month': 1.1, 'One year': -0.4, 'Two year': -1.0 },
      internetService: { 'Fiber optic': 0.2, 'DSL': 0.1, 'No': -0.2 },
      techSupport: { 'Yes': -0.45, 'No': 0.45, 'No internet service': 0.1 },
      onlineSecurity: { 'Yes': -0.25, 'No': 0.25, 'No internet service': 0 },
      numServices: -0.18,
    },
    bias: 0.35,
    avgChurnRate: 32.1,
    benchmarks: { tenure: 18, monthlyCharges: 80 },
  },
};

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export function predictChurn(customer, industryKey = 'telecom') {
  const industry = INDUSTRIES[industryKey];
  const w = industry.weights;
  let logit = industry.bias;

  // Tenure
  logit += w.tenure * Math.min(customer.tenure, 72);

  // Monthly charges
  logit += w.monthlyCharges * customer.monthlyCharges;

  // Total charges
  logit += w.totalCharges * (customer.totalCharges || customer.monthlyCharges * customer.tenure);

  // Categorical features
  const contractScore = w.contractType[customer.contractType] ?? 0;
  logit += contractScore;

  const internetScore = w.internetService[customer.internetService] ?? 0;
  logit += internetScore;

  const techScore = w.techSupport[customer.techSupport] ?? 0;
  logit += techScore;

  const secScore = w.onlineSecurity[customer.onlineSecurity] ?? 0;
  logit += secScore;

  // Number of services
  logit += w.numServices * (customer.numServices || 1);

  // Add small noise for realism
  logit += (Math.random() - 0.5) * 0.15;

  const probability = sigmoid(logit);

  const riskLevel = probability >= 0.7 ? 'High' : probability >= 0.4 ? 'Medium' : 'Low';

  const reasons = generateReasons(customer, industry, probability);
  const recommendations = generateRecommendations(riskLevel, industry.label, reasons);
  const factors = generateFactors(customer, industry, w);

  return {
    probability: Math.round(probability * 1000) / 10,
    riskLevel,
    reasons,
    recommendations,
    factors,
  };
}

function generateReasons(customer, industry, probability) {
  const reasons = [];
  const bench = industry.benchmarks;

  if (customer.contractType === 'Month-to-month') {
    reasons.push({ factor: 'Contract Type', detail: 'Month-to-month contracts have 3x higher churn rate', impact: 'high', icon: '📋' });
  }
  if (customer.tenure < 12) {
    reasons.push({ factor: 'Low Tenure', detail: `Only ${customer.tenure} months — new customers churn most`, impact: 'high', icon: '⏱️' });
  } else if (customer.tenure < bench.tenure) {
    reasons.push({ factor: 'Below-Average Tenure', detail: `Tenure is below the ${bench.tenure}-month industry benchmark`, impact: 'medium', icon: '⏱️' });
  }
  if (customer.monthlyCharges > bench.monthlyCharges * 1.3) {
    reasons.push({ factor: 'High Monthly Charges', detail: `$${customer.monthlyCharges}/mo is significantly above average`, impact: 'high', icon: '💰' });
  } else if (customer.monthlyCharges > bench.monthlyCharges) {
    reasons.push({ factor: 'Above-Average Charges', detail: `Charges exceed the $${bench.monthlyCharges} benchmark`, impact: 'medium', icon: '💰' });
  }
  if (customer.techSupport === 'No') {
    reasons.push({ factor: 'No Tech Support', detail: 'Customers without support are 2x more likely to churn', impact: 'medium', icon: '🛠️' });
  }
  if (customer.onlineSecurity === 'No') {
    reasons.push({ factor: 'No Online Security', detail: 'Missing security features correlate with dissatisfaction', impact: 'medium', icon: '🔐' });
  }
  if (customer.internetService === 'Fiber optic' && customer.techSupport === 'No') {
    reasons.push({ factor: 'High-Value + No Support', detail: 'Fiber customers without support are at highest risk', impact: 'high', icon: '🌐' });
  }
  if ((customer.numServices || 1) <= 2) {
    reasons.push({ factor: 'Low Product Adoption', detail: 'Using few services means lower switching costs', impact: 'low', icon: '📦' });
  }

  return reasons.slice(0, 4);
}

function generateRecommendations(riskLevel, industry, reasons) {
  const base = {
    High: [
      { action: 'Immediate Retention Offer', detail: 'Offer 20–30% discount or free upgrade for 3 months', priority: 'urgent', icon: '🎯' },
      { action: 'Personal Outreach Call', detail: 'Have a CSM reach out within 24 hours', priority: 'urgent', icon: '📞' },
      { action: 'Loyalty Package', detail: 'Propose annual contract with exclusive benefits', priority: 'high', icon: '🏆' },
    ],
    Medium: [
      { action: 'Engagement Email Campaign', detail: 'Send personalized value-summary email this week', priority: 'high', icon: '📧' },
      { action: 'Feature Education', detail: 'Share tutorials on underused features', priority: 'medium', icon: '📚' },
      { action: 'Check-in Survey', detail: 'NPS survey to surface hidden dissatisfaction', priority: 'medium', icon: '📊' },
    ],
    Low: [
      { action: 'Upsell Opportunity', detail: 'Introduce premium tier or add-on services', priority: 'low', icon: '⬆️' },
      { action: 'Referral Program', detail: 'Invite to referral program — satisfied customers are your best advocates', priority: 'low', icon: '🤝' },
    ],
  };

  const recs = [...base[riskLevel]];

  // Reason-specific additions
  const hasContractRisk = reasons.some(r => r.factor === 'Contract Type');
  if (hasContractRisk && riskLevel !== 'Low') {
    recs.push({ action: 'Contract Upgrade Incentive', detail: 'Offer 2 months free to switch to annual contract', priority: 'high', icon: '📋' });
  }

  return recs.slice(0, 3);
}

function generateFactors(customer, industry, w) {
  return [
    { name: 'Contract Risk', value: customer.contractType === 'Month-to-month' ? 85 : customer.contractType === 'One year' ? 35 : 10, color: '#f43f5e' },
    { name: 'Tenure Score', value: Math.max(0, Math.min(100, 100 - customer.tenure * 1.2)), color: '#fbbf24' },
    { name: 'Charge Pressure', value: Math.min(100, (customer.monthlyCharges / 150) * 100), color: '#f43f5e' },
    { name: 'Support Deficit', value: customer.techSupport === 'No' ? 70 : 20, color: '#fbbf24' },
    { name: 'Product Adoption', value: Math.max(0, 100 - (customer.numServices || 1) * 15), color: '#22d3ee' },
    { name: 'Security Gap', value: customer.onlineSecurity === 'No' ? 60 : 15, color: '#818cf8' },
  ];
}

// Generate mock dataset
export function generateMockData(count = 50, industryKey = 'telecom') {
  const contracts = ['Month-to-month', 'One year', 'Two year'];
  const internet = ['Fiber optic', 'DSL', 'No'];
  const yesNo = ['Yes', 'No'];

  return Array.from({ length: count }, (_, i) => {
    const tenure = Math.floor(Math.random() * 72) + 1;
    const monthlyCharges = Math.round((20 + Math.random() * 100) * 100) / 100;
    const contractType = contracts[Math.floor(Math.random() * 3)];
    const internetService = internet[Math.floor(Math.random() * 3)];
    const techSupport = yesNo[Math.floor(Math.random() * 2)];
    const onlineSecurity = yesNo[Math.floor(Math.random() * 2)];
    const numServices = Math.floor(Math.random() * 6) + 1;

    const customer = {
      id: `CUST-${String(i + 1001).padStart(4, '0')}`,
      name: generateName(),
      tenure,
      monthlyCharges,
      totalCharges: Math.round(monthlyCharges * tenure * 100) / 100,
      contractType,
      internetService,
      techSupport,
      onlineSecurity,
      numServices,
    };

    const prediction = predictChurn(customer, industryKey);
    return { ...customer, ...prediction };
  });
}

function generateName() {
  const first = ['Alex', 'Morgan', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'Blake', 'Drew', 'Cameron', 'Dakota', 'Emery', 'Finley'];
  const last = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White'];
  return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
}

// Aggregate stats
export function computeStats(customers) {
  const total = customers.length;
  const highRisk = customers.filter(c => c.riskLevel === 'High').length;
  const medRisk = customers.filter(c => c.riskLevel === 'Medium').length;
  const avgChurn = customers.reduce((s, c) => s + c.probability, 0) / total;

  const byContract = {};
  customers.forEach(c => {
    if (!byContract[c.contractType]) byContract[c.contractType] = { total: 0, churned: 0 };
    byContract[c.contractType].total++;
    if (c.riskLevel === 'High') byContract[c.contractType].churned++;
  });
  const contractChurn = Object.entries(byContract).map(([name, d]) => ({
    name, rate: Math.round((d.churned / d.total) * 100), count: d.total,
  }));

  const tenureBuckets = [
    { range: '0-12', label: '0–12 mo', min: 0, max: 12 },
    { range: '13-24', label: '13–24 mo', min: 13, max: 24 },
    { range: '25-48', label: '25–48 mo', min: 25, max: 48 },
    { range: '49+', label: '49+ mo', min: 49, max: Infinity },
  ];
  const tenureChurn = tenureBuckets.map(b => {
    const group = customers.filter(c => c.tenure >= b.min && c.tenure <= b.max);
    const highInGroup = group.filter(c => c.riskLevel === 'High').length;
    return { name: b.label, churnRate: group.length ? Math.round((highInGroup / group.length) * 100) : 0, count: group.length };
  });

  // Monthly trend (simulated)
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrend = months.map((month, i) => ({
    month,
    churnRate: Math.round(avgChurn * 0.8 + Math.sin(i * 0.8) * 8 + Math.random() * 5),
    retained: Math.round(100 - avgChurn * 0.8 - Math.sin(i * 0.8) * 5),
  }));

  const alerts = [];
  const newCustomers = customers.filter(c => c.tenure < 6);
  const newHighRisk = newCustomers.filter(c => c.riskLevel === 'High');
  if (newHighRisk.length > newCustomers.length * 0.4) {
    alerts.push({ type: 'danger', message: `High churn risk among new users (${newHighRisk.length}/${newCustomers.length} < 6 months)`, icon: '🔴' });
  }
  const mtm = customers.filter(c => c.contractType === 'Month-to-month' && c.riskLevel === 'High');
  if (mtm.length > 5) {
    alerts.push({ type: 'warning', message: `${mtm.length} month-to-month customers at high churn risk`, icon: '🟡' });
  }
  if (avgChurn > 50) {
    alerts.push({ type: 'danger', message: `Average churn probability spike: ${Math.round(avgChurn)}%`, icon: '🔴' });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'success', message: 'Churn metrics within normal range — keep monitoring', icon: '🟢' });
  }

  return { total, highRisk, medRisk, avgChurn: Math.round(avgChurn), contractChurn, tenureChurn, monthlyTrend, alerts };
}
