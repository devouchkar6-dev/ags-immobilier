// netlify/functions/get-biens.js
// Fonction serverless : récupère tous les biens depuis l'API APIMO
// et les transforme au format attendu par le site AGS

const APIMO_API_URL = 'https://api.apimo.pro';
const PROVIDER_ID   = process.env.APIMO_PROVIDER_ID;   // À configurer dans Netlify > Environment variables
const API_TOKEN     = process.env.APIMO_API_TOKEN;      // À configurer dans Netlify > Environment variables
const AGENCY_ID     = process.env.APIMO_AGENCY_ID;      // À configurer dans Netlify > Environment variables

// Mapping des types de biens APIMO → labels site
const TYPE_MAP = {
  1:  'Appartement',
  2:  'Maison',
  3:  'Terrain',
  4:  'Commerce',
  5:  'Bureau',
  6:  'Garage',
  7:  'Immeuble',
  8:  'Viager',
  9:  'Parking',
  10: 'Divers',
};

// Mapping des catégories de transaction
const TRANSACTION_MAP = {
  1: 'vente',
  2: 'location',
  3: 'viager',
};

// Mapping des villes vers les valeurs du filtre
const CITY_FILTER_MAP = {
  'le cannet':            'cannet',
  'cannes':               'cannes',
  'mougins':              'mougins',
  'mandelieu':            'mandelieu',
  'mandelieu-la-napoule': 'mandelieu',
  'vallauris':            'vallauris',
  'antibes':              'antibes',
  'nice':                 'nice',
  'grasse':               'grasse',
};

function normalizeCity(cityName) {
  if (!cityName) return 'autre';
  const lower = cityName.toLowerCase().trim();
  for (const [key, val] of Object.entries(CITY_FILTER_MAP)) {
    if (lower.includes(key)) return val;
  }
  return lower.replace(/\s+/g, '-');
}

function formatPrice(price, transaction) {
  if (!price) return 'Nous contacter';
  const n = parseInt(price);
  if (transaction === 'location') {
    return n.toLocaleString('fr-FR') + ' €/mois';
  }
  if (n >= 1000000) {
    return (n / 1000000).toFixed(2).replace('.', ',') + ' M€';
  }
  return n.toLocaleString('fr-FR') + ' €';
}

function getBudgetCategory(price, transaction) {
  const n = parseInt(price) || 0;
  if (transaction === 'location') {
    if (n <= 800)  return '0-800';
    if (n <= 1500) return '800-1500';
    return '1500+';
  }
  if (n <= 200000)  return '0-200k';
  if (n <= 500000)  return '200k-500k';
  if (n <= 1000000) return '500k-1M';
  return '1M+';
}

// Transforme un bien APIMO en objet simplifié pour le site
function transformBien(apimoBien) {
  const transaction = TRANSACTION_MAP[apimoBien.category] || 'vente';
  const typeLabel   = TYPE_MAP[apimoBien.type] || 'Bien';
  const city        = apimoBien.city?.name || apimoBien.address?.city || '';
  const price       = apimoBien.price?.value || apimoBien.price || 0;
  const surface     = apimoBien.area?.total || apimoBien.area || 0;
  const rooms       = apimoBien.rooms || 0;
  const bedrooms    = apimoBien.bedrooms || 0;

  // Photos : prendre les 6 premières
  const photos = (apimoBien.images || [])
    .sort((a, b) => (a.rank || 0) - (b.rank || 0))
    .slice(0, 6)
    .map(img => img.url || img.thumb_url || img.src);

  // Photo principale (vignette)
  const mainPhoto = photos[0] || null;

  return {
    id:           apimoBien.id,
    reference:    apimoBien.reference || apimoBien.id,
    titre:        `${typeLabel} ${surface ? surface + ' m²' : ''} – ${city}`.trim(),
    type:         typeLabel.toLowerCase().includes('viager') ? 'viager' :
                  typeLabel.toLowerCase().includes('commerce') || typeLabel.toLowerCase().includes('bureau') ? 'commercial' :
                  transaction === 'location' ? 'location' : 'vente',
    transaction:  transaction,
    typeLabel:    typeLabel,
    ville:        city,
    villeFilter:  normalizeCity(city),
    surface:      surface,
    rooms:        rooms,
    bedrooms:     bedrooms,
    prix:         formatPrice(price, transaction),
    prixBrut:     parseInt(price) || 0,
    budgetCat:    getBudgetCategory(price, transaction),
    mainPhoto:    mainPhoto,
    photos:       photos,
    description:  apimoBien.description?.fr || apimoBien.description || '',
    dpe:          apimoBien.dpe?.letter || null,
    ges:          apimoBien.ges?.letter || null,
    caracteristiques: {
      surface:    surface ? `${surface} m²` : null,
      pieces:     rooms   ? `${rooms} pièces` : null,
      chambres:   bedrooms ? `${bedrooms} chambres` : null,
      etage:      apimoBien.floor ? `Étage ${apimoBien.floor}` : null,
      annee:      apimoBien.construction_year || null,
      exposition: apimoBien.orientation || null,
    },
    url: `bien-${apimoBien.id}.html`,
    actif: apimoBien.status === 1,
    dateCreation: apimoBien.created_at,
    dateMaj:      apimoBien.updated_at,
  };
}

exports.handler = async (event) => {
  // Vérifier que les variables d'environnement sont configurées
  if (!PROVIDER_ID || !API_TOKEN || !AGENCY_ID) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Configuration APIMO manquante',
        message: 'Veuillez configurer APIMO_PROVIDER_ID, APIMO_API_TOKEN et APIMO_AGENCY_ID dans les variables d\'environnement Netlify.',
        biens: [],
        filtres: { villes: [], types: [], transactions: [] }
      })
    };
  }

  try {
    // Appel API APIMO — récupération de tous les biens de l'agence
    const response = await fetch(
      `${APIMO_API_URL}/agencies/${AGENCY_ID}/properties`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${PROVIDER_ID}:${API_TOKEN}`).toString('base64'),
          'Accept':        'application/json',
          'Content-Type':  'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`APIMO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const biensBruts = data.properties || data.items || data || [];

    // Transformer et filtrer (garder seulement les biens actifs)
    const biens = biensBruts
      .map(transformBien)
      .filter(b => b.actif && b.mainPhoto); // Seulement biens actifs avec photo

    // Générer les filtres dynamiquement depuis les biens disponibles
    const villes      = [...new Set(biens.map(b => b.villeFilter))].filter(Boolean);
    const types       = [...new Set(biens.map(b => b.type))].filter(Boolean);
    const transactions = [...new Set(biens.map(b => b.transaction))].filter(Boolean);

    // Générer les options budget
    const budgets = [...new Set(biens.map(b => b.budgetCat))].filter(Boolean);

    return {
      statusCode: 200,
      headers: {
        'Content-Type':  'application/json',
        'Cache-Control': 'public, max-age=300', // Cache 5 minutes
      },
      body: JSON.stringify({
        biens,
        total: biens.length,
        filtres: {
          villes:       villes.sort(),
          types:        types.sort(),
          transactions: transactions.sort(),
          budgets:      budgets.sort(),
        },
        lastUpdate: new Date().toISOString(),
      })
    };

  } catch (err) {
    console.error('Erreur APIMO:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message,
        biens: [],
        filtres: { villes: [], types: [], transactions: [] }
      })
    };
  }
};
