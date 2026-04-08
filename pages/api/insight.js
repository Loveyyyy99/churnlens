// pages/api/insight.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { stats, industry } = req.body;

  if (!stats) {
    return res.status(400).json({ error: 'Stats data required' });
  }

  const prompt = `You are a senior customer retention analyst specializing in ${industry} industry.

Here is the current customer churn data summary:
- Total Customers: ${stats.total}
- High Risk Customers: ${stats.highRisk} (${Math.round((stats.highRisk / stats.total) * 100)}%)
- Medium Risk Customers: ${stats.medRisk}
- Average Churn Probability: ${stats.avgChurn}%
- Churn by Contract Type: ${JSON.stringify(stats.contractChurn)}
- Churn by Tenure Group: ${JSON.stringify(stats.tenureChurn)}

Generate exactly 4 sharp, actionable business insights AND 2-3 critical alerts based on this data.

Insights should identify patterns, opportunities, and strategic recommendations.
Alerts should flag urgent issues, anomalies, or immediate action items.

Each must be specific to the numbers above — no generic advice.

Respond ONLY with a valid JSON object. No explanation, no markdown, no backticks. Just the raw JSON like this:
{
  "insights": [
    {
      "icon": "🚨",
      "title": "short title under 10 words",
      "body": "2-3 sentence specific insight with numbers from the data"
    }
  ],
  "alerts": [
    {
      "type": "danger",
      "icon": "🔴",
      "message": "specific alert message with numbers"
    }
  ]
}

Alert types must be: "danger" (critical/urgent), "warning" (needs attention), or "success" (positive metric).`;

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY ;

  // Using Gemini 1.5 Flash (the lite/fast version)
  const model = 'gemini-3.1-flash-lite-preview'; // Or use 'gemini-1.5-flash' for standard version

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', err);
      return res.status(500).json({ error: 'Gemini request failed', details: err });
    }

    const data = await response.json();
    const raw = data.candidates[0].content.parts[0].text.trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return res.status(200).json({
      success: true,
      insights: result.insights || [],
      alerts: result.alerts || []
    });
  } catch (err) {
    console.error('Insights API error:', err);
    return res.status(500).json({ error: 'Failed to generate insights', details: err.message });
  }
}