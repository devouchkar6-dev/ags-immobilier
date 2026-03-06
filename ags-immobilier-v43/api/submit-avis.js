// api/submit-avis.js
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { note, prenom, nom, contexte, texte } = req.body || {};

  if (!note || !prenom || !nom || !texte || texte.length < 20) {
    return res.status(400).json({ error: 'Données invalides' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO  = 'devouchkar6-dev/ags-immobilier';
  const AVIS_PATH    = 'ags-immobilier-v43/avis.json';

  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${AVIS_PATH}`,
      { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } }
    );

    let sha = null;
    let avisExistants = [];
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
      avisExistants = JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8'));
    }

    const nouvelAvis = {
      id: Date.now().toString(),
      note: parseInt(note),
      prenom: prenom.trim(),
      nom: nom.trim(),
      contexte: (contexte || '').trim(),
      texte: texte.trim(),
      statut: 'en_attente',
      date: new Date().toLocaleDateString('fr-FR'),
      dateISO: new Date().toISOString()
    };
    avisExistants.push(nouvelAvis);

    const content = Buffer.from(JSON.stringify(avisExistants, null, 2), 'utf-8').toString('base64');
    const body = { message: `Nouvel avis — ${prenom}`, content };
    if (sha) body.sha = sha;

    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${AVIS_PATH}`,
      {
        method: 'PUT',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (putRes.ok) {
      return res.status(200).json({ success: true });
    } else {
      const err = await putRes.json();
      return res.status(500).json({ error: err.message || 'Erreur GitHub' });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
