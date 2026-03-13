# ElectraBenin
ElectraBénin – Calculateur de factures d’électricité Calculateur fiable et indépendant basé sur les tarifs officiels SBEE  Important : ElectraBénin n’est pas affiliée à la SBEE. Tous les calculs sont basés sur les barèmes officiels publiés par la SBEE et mis à jour régulièrement.

# ⚡ ElectraBénin

> Calculateur de factures SBEE — Outil indépendant pour les abonnés Basse Tension au Bénin.

![Version](https://img.shields.io/badge/version-1.0.0-red)
![Licence](https://img.shields.io/badge/licence-Propriétaire-lightgrey)
![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-yellow)

---

## 📋 Présentation

**ElectraBénin** est une application web monopage permettant aux abonnés SBEE (Société Béninoise d'Énergie Électrique) de calculer leur facture d'électricité avec précision, sans inscription ni connexion.

Tous les calculs sont effectués **localement dans le navigateur**. Aucune donnée n'est transmise.

---

## 🗂️ Structure du projet

```
electrabenin/
├── index.html        → Page d'accueil + Guide d'utilisation + CGU
├── calcul.html       → Calculateur de factures (3 modes)
├── dashboard.html    → Interface d'administration des publicités
├── app.js            → Logique métier : calculs SBEE, navigation, carousels
├── style.css         → Feuille de style (charte graphique SBEE)
└── README.md         → Ce fichier
```

---

## ✨ Fonctionnalités

### 🔢 Calculateur (3 modes)
| Mode | Description |
|------|-------------|
| **kWh → Facture** | Entrez votre consommation, obtenez le montant exact TTC |
| **Facture → kWh** | Entrez le montant de votre facture, retrouvez la consommation estimée |
| **Compteur partagé** | Répartissez une facture entre 2 à 7 colocataires au prorata |

### 📊 Tarifs SBEE pris en charge
| Tarif | Type | Prix |
|-------|------|------|
| **BT 1** | Résidentiel / Domestique | 86 / 125 / 148 FCFA/kWh (3 tranches) |
| **BT 2** | Professionnel / Commerce | 125 FCFA/kWh + TVA 18% |
| **BT 3** | Éclairage public | 133 FCFA/kWh + TVA 18% |

### 📢 Système de publicités
- Gestion complète via `dashboard.html` (ajout, modification, suppression)
- Chaque publicité contient : image, nom de l'entreprise, coordonnées, description, lien
- Carousels automatiques sur l'accueil et dans le calculateur
- Statistiques de vues et clics par publicité
- Contrôle : emplacement (accueil / calculateur / les deux), durée, date d'expiration

---

## 🚀 Déploiement

### Prérequis
Aucune dépendance. Aucun build. Aucun serveur requis.

Seul un **navigateur moderne** est nécessaire (Chrome, Firefox, Edge, Safari).

### Installation

1. Déposer les 5 fichiers sur votre hébergeur :
```
index.html  calcul.html  dashboard.html  app.js  style.css
```

2. Accéder à `index.html` — c'est tout.

### Hébergement recommandé
Tout hébergeur de fichiers statiques convient :
- Apache / Nginx
- GitHub Pages
- Netlify / Vercel
- Hébergeur cPanel classique

---

## 🧭 Navigation

```
index.html
  ├── Accueil        → bouton "Commencer maintenant" → calcul.html
  ├── Guide          → goGuide() — affichage dans la même page
  └── CGU / Collab   → sections intégrées au guide

calcul.html
  ├── ← Accueil      → index.html
  ├── Guide / CGU    → index.html#guide
  └── 3 onglets      → kWh→Facture · Facture→kWh · Compteur partagé

dashboard.html       → accès direct (protégé par mot de passe)
```

---

## 🔧 Paramètres de configuration

Tout est modifiable dans `app.js` (section `CONSTANTES TARIFAIRES`) :

```js
var C = {
  D:   500,   // Prime fixe mensuelle (FCFA)
  E:   3,     // Taxe Communes — Éclairage Public (FCFA/kWh)
  F:   3,     // Fonds d'Électrification Rurale (FCFA/kWh)
  TVA: 0.18,  // TVA (18%)
  BT1_SOCIALE: 86,   // Tranche sociale BT1 ≤ 20 kWh
  BT1_T1:     125,   // Tranche 1 BT1 : 21–250 kWh
  BT1_T2:     148,   // Tranche 2 BT1 : > 250 kWh
  BT2:        125,   // Tarif BT2
  BT3:        133    // Tarif BT3
};
```

---

## 🔐 Dashboard Admin

Accès : `dashboard.html`

Le dashboard permet de gérer les publicités affichées dans l'application. Les données sont stockées dans le `localStorage` du navigateur sous les clés :

| Clé | Contenu |
|-----|---------|
| `eb_pubs` | Liste des publicités (JSON) |
| `eb_config` | Configuration globale (durée carousel…) |
| `eb_stats` | Statistiques vues / clics par pub |

### Structure d'une publicité
```json
{
  "id": 1710000000000,
  "name": "Nom de la campagne",
  "href": "https://destination.com",
  "img": "data:image/...",
  "alt": "Nom de l'entreprise",
  "contact": "+229 01 00 00 00 · Cotonou",
  "desc": "Description courte de l'offre",
  "slot": "both",
  "active": true,
  "expires": "2025-12-31",
  "duration": 8,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Valeurs du champ `slot` :**
- `"both"` — Accueil + Calculateur
- `"sidebar"` — Accueil uniquement
- `"bottom"` — Calculateur uniquement

---

## 🎨 Charte graphique

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--red` | `#ed1f24` | Couleur principale SBEE |
| `--yellow` | `#f9a825` | Accent / bande |
| `--green` | `#00cc66` | Statut actif / succès |
| `--blue` | `#3b5998` | Secondaire |
| Police | Poppins | Interface |
| Police mono | Fira Code | Montants, chiffres |

---

## ✅ Vérification des calculs

Le fichier `app.js` intègre un auto-test au chargement :

```js
// 15 kWh BT1 doit retourner 2 202 FCFA
calcFacture(15, 'BT1').net === 2202  ✅
```

Le résultat est visible dans la console du navigateur (`F12`).

---

## ⚠️ Avertissement légal

ElectraBénin est un outil **indépendant, non affilié à la SBEE**.  
Les résultats sont fournis à titre indicatif. Des écarts mineurs peuvent exister avec la facture officielle (arrondis SBEE).

---

## 📬 Contact & Collaboration

Pour un partenariat publicitaire ou toute collaboration :

- **WhatsApp** : +229 00 00 00 00
- **Email** : contact@electrabenin.com
- **Instagram** : [@electrabenin](https://instagram.com/electrabenin)

---

*ElectraBénin © 2025 — Outil non officiel · Tarifs SBEE 2023*