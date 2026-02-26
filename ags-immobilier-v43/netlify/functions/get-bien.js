// netlify/functions/get-bien.js
// Retourne le détail d'un bien APIMO par son ID

const APIMO_API_URL = 'https://api.apimo.pro';
const PROVIDER_ID   = process.env.APIMO_PROVIDER_ID;
const API_TOKEN     = process.env.APIMO_API_TOKEN;
const AGENCY_ID     = process.env.APIMO_AGENCY_ID;

exports.handler = async (event) => {
  const bienId = event.queryStringParameters?.id || event.path.split('/').pop();

  if (!bienId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'ID manquant' }) };
  }

  if (!PROVIDER_ID || !API_TOKEN || !AGENCY_ID) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Configuration APIMO manquante' }) };
  }

  try {
    const response = await fetch(
      `${APIMO_API_URL}/agencies/${AGENCY_ID}/properties/${bienId}`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${PROVIDER_ID}:${API_TOKEN}`).toString('base64'),
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) throw new Error(`APIMO: ${response.status}`);

    const bien = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify(bien)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
