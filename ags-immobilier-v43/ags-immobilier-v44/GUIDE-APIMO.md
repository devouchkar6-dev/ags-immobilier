# 🔗 Guide de configuration APIMO + Netlify
## AGS Immobilier — Synchronisation automatique des biens

---

## ✅ Ce qui est déjà fait (dans le ZIP)

Le site est entièrement préparé pour APIMO :
- **`netlify/functions/get-biens.js`** — récupère tous vos biens depuis APIMO
- **`netlify/functions/get-bien.js`** — récupère le détail d'un bien
- **`bien-apimo.html`** — fiche bien dynamique (s'adapte à n'importe quel bien)
- **`netlify.toml`** — configuration des routes API
- **`index.html`** — chargement automatique + filtres dynamiques

Dès qu'un bien est **créé, modifié ou supprimé** dans APIMO → le site se met à jour automatiquement (cache 5 minutes).

---

## 📋 Étapes de configuration (30 minutes)

### ÉTAPE 1 — Récupérer vos identifiants APIMO

1. Connectez-vous sur **https://pro.apimo.net**
2. Allez dans **Mon compte → API** (ou Paramètres → Accès API)
3. Notez ces 3 valeurs :
   - **Provider ID** : un numéro (ex: `12345`)
   - **API Token** : une clé alphanumérique (ex: `abc123xyz...`)
   - **Agency ID** : l'identifiant de votre agence (ex: `67890`)

---

### ÉTAPE 2 — Déployer sur Netlify avec GitHub

#### 2a. Créer un compte GitHub (gratuit)
1. Allez sur **https://github.com**
2. Créez un compte (bouton "Sign up")

#### 2b. Créer un dépôt GitHub
1. Cliquez sur **"New repository"**
2. Nom : `ags-immobilier`
3. Visibilité : **Private** (privé — personne ne verra votre code)
4. Cliquez **"Create repository"**

#### 2c. Uploader le site
1. Sur la page du dépôt, cliquez **"uploading an existing file"**
2. Décompressez le ZIP `ags-immobilier-vXX.zip`
3. Glissez **tous les fichiers** dans GitHub
4. Cliquez **"Commit changes"**

#### 2d. Connecter GitHub à Netlify
1. Sur **https://app.netlify.com**, cliquez **"Add new site → Import from Git"**
2. Choisissez **GitHub**
3. Sélectionnez votre dépôt `ags-immobilier`
4. Build command : *(laisser vide)*
5. Publish directory : `.`
6. Cliquez **"Deploy site"**

---

### ÉTAPE 3 — Configurer les variables APIMO dans Netlify

1. Dans votre dashboard Netlify, allez dans :
   **Site settings → Environment variables → Add a variable**

2. Ajoutez ces 3 variables :

   | Clé | Valeur |
   |-----|--------|
   | `APIMO_PROVIDER_ID` | Votre Provider ID APIMO |
   | `APIMO_API_TOKEN` | Votre Token APIMO |
   | `APIMO_AGENCY_ID` | Votre Agency ID APIMO |

3. Cliquez **"Save"**

4. **Redéployez** le site : *Deploys → Trigger deploy → Deploy site*

---

### ÉTAPE 4 — Tester la connexion

Ouvrez dans votre navigateur :
```
https://votre-site.netlify.app/api/biens
```

Vous devriez voir un JSON avec vos biens APIMO. ✅

---

## 🏠 Comment ça fonctionne ensuite

### Quand vous créez un bien dans APIMO :
1. Vous enregistrez le bien dans APIMO normalement
2. **Dans les 5 minutes** → le bien apparaît automatiquement sur le site
3. Les filtres (ville, type, budget) se mettent à jour seuls
4. La fiche bien est générée automatiquement avec toutes les photos

### Quand vous modifiez un bien :
- Prix, photos, description → mis à jour automatiquement

### Quand vous archivez un bien :
- Il disparaît automatiquement du site

**Aucune intervention manuelle nécessaire.** 🎉

---

## ⚙️ Options avancées (optionnel)

### Webhook APIMO (mise à jour instantanée)
Pour une mise à jour en temps réel (au lieu de 5 minutes), APIMO peut envoyer un webhook à Netlify à chaque modification. Contactez-nous pour configurer cette option.

### Domaine personnalisé
Pour utiliser `www.ags-immobilier.fr` à la place de `xxx.netlify.app` :
1. Netlify → Domain settings → Add custom domain
2. Modifier les DNS chez votre registrar

---

## 📞 Support

En cas de problème : nous pouvons vous aider à configurer chaque étape.
- Email : agence.ags@gmail.com
- Tél : 06 07 13 11 81

---
*Documentation générée pour AGS Immobilier — Le Cannet*
