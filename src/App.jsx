
import { useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard, CloudSun, CloudRain, ThermometerSun,
  MapPin, Sprout, Bell, BookOpen, FileText, Globe,
  Menu, X, Droplets, Wind, Leaf, ChevronRight,
  ChevronDown, Sun, ShieldCheck, Map, TrendingUp
} from "lucide-react";

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

import {
  buildAlerts, buildSeasonTotals, describeWeather, fetchClimate,
  fetchWeather, monthLabel, rainfallTotals, temperatureTotals, toCsv,
  weatherKind
} from "./climate";
import { districtCenters } from "./mapGeo";
import RwandaMap from "./RwandaMap";

import "./App.css";

// RWANDA: 5 PROVINCES AND 30 DISTRICTS
const locations = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],

  "Northern Province": [
    "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"
  ],

  "Southern Province": [
    "Gisagara", "Huye", "Kamonyi", "Muhanga",
    "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"
  ],

  "Eastern Province": [
    "Bugesera", "Gatsibo", "Kayonza", "Kirehe",
    "Ngoma", "Nyagatare", "Rwamagana"
  ],

  "Western Province": [
    "Karongi", "Ngororero", "Nyabihu", "Nyamasheke",
    "Rubavu", "Rusizi", "Rutsiro"
  ]
};

// THREE LANGUAGES
const translations = {
  rw: {
    home: "Ahabanza",
    weather: "Ikirere",
    rainfall: "Imvura",
    temperature: "Ubushyuhe",
    map: "Ikarita y'u Rwanda",
    agriculture: "Ubuhinzi",
    alerts: "Imiburo",
    education: "Kwiga ku kirere",
    reports: "Raporo",
    welcome: "Murakaza neza!",
    subtitle: "Menya amakuru y'ikirere mu turere tw'u Rwanda.",
    overview: "Imiterere y'ikirere",
    humidity: "Ububobere",
    wind: "Umuvuduko w'umuyaga",
    selectProvince: "Hitamo Intara",
    selectDistrict: "Hitamo Akarere",
    rainfallChart: "Imiterere y'imvura mu mezi",
    noData: "Nta makuru nyayo arahari",
    sample: "Amakuru anyayo ava kuri Open-Meteo.",
    country: "U Rwanda",
    mission: "Duharanire kurengera ibidukikije",
    missionText: "Turinde ikirere, ubutaka n'amashyamba kugira ngo u Rwanda rugire ejo hazaza heza.",
    explore: "Soma byinshi",
    footer: "Ikirere Cyacu · U Rwanda rwacu",
    sectionDescription: "Iki gice kiri gutegurwa.",
    mainMenu: "IBIKUBIYEHO",
    chartNote: "Imibare ishingiye ku makuru anyayo ya Open-Meteo.",
    selected: "Byahiswemo",
    districts: "Uturere",
    loading: "Turashakisha amakuru anyayo...",
    dataError: "Ntibyakunze kubona amakuru y'ikirere.",
    retry: "Ongera ugerageze",
    source: "Amakuru anyayo: Open-Meteo",
    live: "Amakuru anyayo",
    updated: "Byavuguruwe",
    noAlerts: "Nta miburo ikomeye ihari ubu."
  },

  en: {
    home: "Home",
    weather: "Weather",
    rainfall: "Rainfall",
    temperature: "Temperature",
    map: "Rwanda Map",
    agriculture: "Agriculture",
    alerts: "Climate Alerts",
    education: "Climate Education",
    reports: "Reports",
    welcome: "Welcome!",
    subtitle: "Explore climate information across Rwanda's districts.",
    overview: "Climate Overview",
    humidity: "Humidity",
    wind: "Wind Speed",
    selectProvince: "Select Province",
    selectDistrict: "Select District",
    rainfallChart: "Monthly rainfall pattern",
    noData: "No live data available",
    sample: "Live data from Open-Meteo.",
    country: "Rwanda",
    mission: "Let's protect our environment",
    missionText: "Protect our climate, land and forests for a greener Rwanda.",
    explore: "Explore more",
    footer: "Ikirere Cyacu · Our Rwanda",
    sectionDescription: "This section is under development.",
    mainMenu: "MAIN MENU",
    chartNote: "Values based on live Open-Meteo data.",
    selected: "Selected",
    districts: "Districts",
    loading: "Loading live data...",
    dataError: "Could not load live climate data.",
    retry: "Retry",
    source: "Live data: Open-Meteo",
    live: "Live data",
    updated: "Updated",
    noAlerts: "No severe alerts right now."
  },

  fr: {
    home: "Accueil",
    weather: "Météo",
    rainfall: "Pluviométrie",
    temperature: "Température",
    map: "Carte du Rwanda",
    agriculture: "Agriculture",
    alerts: "Alertes climatiques",
    education: "Éducation climatique",
    reports: "Rapports",
    welcome: "Bienvenue !",
    subtitle: "Découvrez les informations climatiques des districts du Rwanda.",
    overview: "Aperçu climatique",
    humidity: "Humidité",
    wind: "Vitesse du vent",
    selectProvince: "Choisir une province",
    selectDistrict: "Choisir un district",
    rainfallChart: "Précipitations mensuelles",
    noData: "Aucune donnée en direct disponible",
    sample: "Données réelles provenant d'Open-Meteo.",
    country: "Rwanda",
    mission: "Protégeons notre environnement",
    missionText: "Protégeons notre climat, nos terres et nos forêts pour un Rwanda plus vert.",
    explore: "En savoir plus",
    footer: "Ikirere Cyacu · Notre Rwanda",
    sectionDescription: "Cette section est en cours de développement.",
    mainMenu: "MENU PRINCIPAL",
    chartNote: "Valeurs basées sur les données réelles d'Open-Meteo.",
    selected: "Sélectionné",
    districts: "Districts",
    loading: "Chargement des données réelles...",
    dataError: "Impossible de charger les données climatiques.",
    retry: "Réessayer",
    source: "Données réelles : Open-Meteo",
    live: "Données réelles",
    updated: "Mis à jour",
    noAlerts: "Aucune alerte sévère pour le moment."
  }
};

// PAGE CONTENT
const pageText = {
  rw: {
    weather: {
      intro: "Reba imiterere y'ikirere n'iteganyagihe by'akarere watoranyije.",
      current: "Ikirere ubu",
      forecast: "Iteganyagihe ry'iminsi 7",
      updated: "Byavuguruwe",
      days: ["Mbere", "Kabiri", "Gatatu", "Kane", "Gatanu", "Gatandatu", "Cyumweru"],
      min: "Bike",
      max: "Byinshi",
      rainChance: "Amahirwe y'imvura",
      conditions: ["Izuba", "Ibicu", "Imvura yoroheje", "Imvura nyinshi", "Ibicu byinshi", "Izuba ryinshi", "Imvura"],
      codes: {
        clear: "Izuba",
        partly: "Ibicu bike",
        cloudy: "Ibicu byinshi",
        fog: "Igihu",
        drizzle: "Imvura yoroheje",
        rain: "Imvura",
        showers: "Imvura y'umuvumba",
        thunder: "Inkuba n'imvura",
        snow: "Urubura"
      }
    },
    rainfall: {
      intro: "Gereranya imvura igwa mu mezi n'amakarere atandukanye y'u Rwanda.",
      annual: "Imvura y'umwaka",
      average: "Impuzandengo y'ukwezi",
      wettest: "Ukwezi kw'imvura nyinshi",
      driest: "Ukwezi kw'imvura nkeya",
      monthly: "Imvura mu mezi",
      byProvince: "Imvura ku ntara",
      bySeason: "Imvura ku bihe by'ubuhinzi",
      note: "Amakuru: Open-Meteo · amezi 12 ashize"
    },
    temperature: {
      intro: "Reba ubushyuhe buke n'ubunini mu mwaka wose.",
      average: "Ubushyuhe bupuzandengo",
      highest: "Ubushyuhe bwinshi",
      lowest: "Ubushyuhe buke",
      range: "Itandukaniro",
      annual: "Ubushyuhe mu mezi",
      note: "Amakuru: Open-Meteo · amezi 12 ashize"
    },
    map: {
      intro: "Hitamo intara n'akarere urebe aho biherereye n'uturere twinshi.",
      provinces: "Intara",
      districtList: "Uturere two mu ntara yatoranyijwe",
      capital: "Umurwa mukuru",
      hint: "Kanda ku ntara cyangwa akarere uhindure aho ugiye.",
      source: "Imbibi: geoBoundaries (ADM1/ADM2)"
    },
    agriculture: {
      intro: "Amakuru y'ubuhinzi ajyanye n'ibihe by'ikirere mu Rwanda.",
      seasons: "Ibihe by'ubuhinzi",
      seasonA: "Igihe A",
      seasonAMonths: "Nzeli – Mutarama",
      seasonADesc: "Imvura nkeya. Igihe cyiza cyo guhinga ibishyimbo, ibigori n'imboga.",
      seasonB: "Igihe B",
      seasonBMonths: "Gashyantare – Gicurasi",
      seasonBDesc: "Imvura nyinshi. Ni igihe gikuru cy'ubuhinzi bw'ibihingwa byinshi.",
      seasonC: "Igihe C",
      seasonCMonths: "Kamena – Kanama",
      seasonCDesc: "Igihe cy'izuba. Koresha uburyo bwo kuhira n'ibihingwa byo mu bishanga.",
      crops: "Ibihingwa by'ingenzi",
      cropList: ["Ibigori", "Ibishyimbo", "Umuceri", "Ibirayi", "Ibitoke", "Ikawa", "Icyayi", "Manioke"],
      tips: "Inama z'ubuhinzi",
      tipList: [
        "Koresha imbuto zihuye n'ubutaka n'imvura by'akarere kawe.",
        "Bika amazi mu bihe by'imvura kugira ngo uyakoreshe mu gihe cy'izuba.",
        "Kurikirana iteganyagihe buri cyumweru mbere yo guhinga cyangwa gufumbira."
      ]
    },
    alerts: {
      intro: "Reba imiburo y'ikirere n'amabwiriza y'ubwirinzi mu karere kawe.",
      advisory: "Inama",
      watch: "Kurikirana",
      warning: "Impuruza",
      issued: "Byatanzwe",
      items: [
        { level: "advisory", title: "Imvura nyinshi mu ntara y'iburengerazuba", text: "Biteganyijwe imvura irenga 40 mm mu masaha 24. Kurinda imirima n'inzuzu." },
        { level: "watch", title: "Umuyaga ukaze mu ntara y'iburasirazuba", text: "Umuvuduko w'umuyaga ushobora kugera kuri 30 km/h ku mugoroba." },
        { level: "warning", title: "Ubushyuhe bwinshi mu Bugarama", text: "Ubushyuhe bushobora kurenga 32°C. Nywa amazi kenshi kandi wirinde izuba rya saa sita." }
      ],
      sampleNote: "Imiburo y'icyitegererezo gusa, ntabwo ari amakuru nyayo.",
      rainTitle: "Imvura nyinshi mu misi iri imbere",
      windTitle: "Umuyaga ukaze mu misi iri imbere",
      heatTitle: "Ubushyuhe bwinshi mu misi iri imbere",
      rainText: "Imvura igeze kuri {value} mm iteganyijwe mu minsi 7 iri imbere.",
      windText: "Umuvuduko w'umuyaga ushobora kugera kuri {value} km/h.",
      heatText: "Ubushyuhe bushobora kugera kuri {value}°C.",
      liveNote: "Iyi miburo iva ku iteganyagihe ry'amakuru anyayo ya Open-Meteo."
    },
    education: {
      intro: "Menya byinshi ku kirere, uko gipimwa n'uko twakirinda.",
      articles: [
        { title: "Ibihe by'imvura mu Rwanda", text: "Menya itandukaniro iri hagati y'igihe A, B na C n'uburyo bigira ingaruka ku buhinzi.", time: "4 min" },
        { title: "Uko usoma iteganyagihe", text: "Menya ibimenyetso by'ubushyuhe, imvura n'umuyaga ku ikarita y'ikirere.", time: "3 min" },
        { title: "Ubuhinzi buhuye n'ikirere", text: "Uburyo bwo guhitamo ibihingwa n'ibihe byo guhinga mu buzima bwa buri munsi.", time: "5 min" }
      ],
      readTime: "Iminota yo gusoma"
    },
    reports: {
      intro: "Pakisha raporo z'ikirere n'amakuru y'ubuhinzi.",
      download: "Pakisha",
      items: [
        { title: "Raporo y'ikirere y'ukwezi", type: "Ikirere", year: "2026" },
        { title: "Iteganyagihe ry'igihe", type: "Ubuhinzi", year: "2026" },
        { title: "Inama z'ubuhinzi", type: "Ubuhinzi", year: "2026" },
        { title: "Raporo y'umwaka w'ikirere", type: "Ikirere", year: "2025" }
      ],
      note: "Raporo z'icyitegererezo gusa."
    }
  },

  en: {
    weather: {
      intro: "Check current conditions and the seven-day outlook for your selected district.",
      current: "Current conditions",
      forecast: "7-day forecast",
      updated: "Updated",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      min: "Low",
      max: "High",
      rainChance: "Rain chance",
      conditions: ["Sunny", "Partly cloudy", "Light rain", "Heavy rain", "Cloudy", "Sunny", "Showers"],
      codes: {
        clear: "Clear sky",
        partly: "Partly cloudy",
        cloudy: "Overcast",
        fog: "Fog",
        drizzle: "Drizzle",
        rain: "Rain",
        showers: "Rain showers",
        thunder: "Thunderstorm",
        snow: "Snow"
      }
    },
    rainfall: {
      intro: "Compare monthly rainfall across Rwanda's provinces and districts.",
      annual: "Annual rainfall",
      average: "Monthly average",
      wettest: "Wettest month",
      driest: "Driest month",
      monthly: "Monthly rainfall",
      byProvince: "Rainfall by province",
      bySeason: "Rainfall by farming season",
      note: "Source: Open-Meteo · last 12 months"
    },
    temperature: {
      intro: "Explore average, high and low temperatures across the year.",
      average: "Average temperature",
      highest: "Highest",
      lowest: "Lowest",
      range: "Range",
      annual: "Monthly temperature",
      note: "Source: Open-Meteo · last 12 months"
    },
    map: {
      intro: "Select a province and district to explore Rwanda's administrative map.",
      provinces: "Provinces",
      districtList: "Districts in the selected province",
      capital: "Capital",
      hint: "Tap a province or district to change the selection.",
      source: "Boundaries: geoBoundaries (ADM1/ADM2)"
    },
    agriculture: {
      intro: "Practical climate information for Rwanda's farming seasons.",
      seasons: "Farming seasons",
      seasonA: "Season A",
      seasonAMonths: "September – January",
      seasonADesc: "Short rains. Suitable for planting beans, maize and vegetables.",
      seasonB: "Season B",
      seasonBMonths: "February – May",
      seasonBDesc: "Long rains. The main growing season for most crops.",
      seasonC: "Season C",
      seasonCMonths: "June – August",
      seasonCDesc: "Dry season. Use irrigation and focus on marshland crops.",
      crops: "Key crops",
      cropList: ["Maize", "Beans", "Rice", "Irish potato", "Banana", "Coffee", "Tea", "Cassava"],
      tips: "Farming tips",
      tipList: [
        "Use seed varieties suited to your district's soil and rainfall.",
        "Harvest and store water during rainy periods for the dry season.",
        "Check the weekly forecast before planting or applying fertiliser."
      ]
    },
    alerts: {
      intro: "Review climate advisories and safety guidance for your area.",
      advisory: "Advisory",
      watch: "Watch",
      warning: "Warning",
      issued: "Issued",
      items: [
        { level: "advisory", title: "Heavy rain in Western Province", text: "More than 40 mm of rain is expected within 24 hours. Protect fields and drainage channels." },
        { level: "watch", title: "Strong winds in Eastern Province", text: "Wind speeds may reach 30 km/h this evening. Secure light structures." },
        { level: "warning", title: "High heat in Bugarama", text: "Temperatures may exceed 32°C. Drink water often and avoid midday sun." }
      ],
      sampleNote: "Illustrative alerts only. Not live emergency information.",
      rainTitle: "Heavy rain expected",
      windTitle: "Strong winds expected",
      heatTitle: "High temperatures expected",
      rainText: "Up to {value} mm of rain is forecast in the next 7 days.",
      windText: "Wind speeds may reach {value} km/h.",
      heatText: "Temperatures may reach {value}°C.",
      liveNote: "These alerts are derived from live Open-Meteo forecast data."
    },
    education: {
      intro: "Learn more about climate, how it is measured and how to stay prepared.",
      articles: [
        { title: "Rwanda's rainy seasons", text: "Understand the difference between Season A, B and C and how they affect farming.", time: "4 min" },
        { title: "How to read a weather forecast", text: "Learn what temperature, rainfall and wind symbols mean on a forecast map.", time: "3 min" },
        { title: "Climate-smart agriculture", text: "Simple ways to choose crops and planting times that fit a changing climate.", time: "5 min" }
      ],
      readTime: "read"
    },
    reports: {
      intro: "Download climate and agriculture reports for planning.",
      download: "Download",
      items: [
        { title: "Monthly Climate Bulletin", type: "Climate", year: "2026" },
        { title: "Seasonal Rainfall Outlook", type: "Agriculture", year: "2026" },
        { title: "Agriculture Climate Advisory", type: "Agriculture", year: "2026" },
        { title: "Annual Climate Review", type: "Climate", year: "2025" }
      ],
      note: "Illustrative reports only."
    }
  },

  fr: {
    weather: {
      intro: "Consultez les conditions actuelles et les prévisions à sept jours pour votre district.",
      current: "Conditions actuelles",
      forecast: "Prévisions à 7 jours",
      updated: "Mis à jour",
      days: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
      min: "Min",
      max: "Max",
      rainChance: "Risque de pluie",
      conditions: ["Ensoleillé", "Partiellement nuageux", "Pluie légère", "Forte pluie", "Nuageux", "Très ensoleillé", "Averses"],
      codes: {
        clear: "Ciel dégagé",
        partly: "Partiellement nuageux",
        cloudy: "Couvert",
        fog: "Brouillard",
        drizzle: "Bruine",
        rain: "Pluie",
        showers: "Averses",
        thunder: "Orage",
        snow: "Neige"
      }
    },
    rainfall: {
      intro: "Comparez les précipitations mensuelles entre les provinces et districts du Rwanda.",
      annual: "Pluie annuelle",
      average: "Moyenne mensuelle",
      wettest: "Mois le plus pluvieux",
      driest: "Mois le plus sec",
      monthly: "Pluie mensuelle",
      byProvince: "Pluie par province",
      bySeason: "Pluie par saison agricole",
      note: "Source : Open-Meteo · 12 derniers mois"
    },
    temperature: {
      intro: "Explorez les températures moyennes, maximales et minimales de l'année.",
      average: "Température moyenne",
      highest: "Maximale",
      lowest: "Minimale",
      range: "Amplitude",
      annual: "Température mensuelle",
      note: "Source : Open-Meteo · 12 derniers mois"
    },
    map: {
      intro: "Sélectionnez une province et un district pour explorer la carte du Rwanda.",
      provinces: "Provinces",
      districtList: "Districts de la province sélectionnée",
      capital: "Capitale",
      hint: "Touchez une province ou un district pour changer la sélection.",
      source: "Limites : geoBoundaries (ADM1/ADM2)"
    },
    agriculture: {
      intro: "Informations climatiques pratiques pour les saisons agricoles du Rwanda.",
      seasons: "Saisons agricoles",
      seasonA: "Saison A",
      seasonAMonths: "Septembre – Janvier",
      seasonADesc: "Petites pluies. Idéale pour les haricots, le maïs et les légumes.",
      seasonB: "Saison B",
      seasonBMonths: "Février – Mai",
      seasonBDesc: "Grandes pluies. La principale saison de culture.",
      seasonC: "Saison C",
      seasonCMonths: "Juin – Août",
      seasonCDesc: "Saison sèche. Utilisez l'irrigation et les cultures de marais.",
      crops: "Cultures principales",
      cropList: ["Maïs", "Haricots", "Riz", "Pomme de terre", "Banane", "Café", "Thé", "Manioc"],
      tips: "Conseils agricoles",
      tipList: [
        "Utilisez des semences adaptées au sol et à la pluie de votre district.",
        "Récoltez et stockez l'eau pendant la saison des pluies.",
        "Consultez les prévisions avant de planter ou de fertiliser."
      ]
    },
    alerts: {
      intro: "Consultez les avis climatiques et les consignes de sécurité de votre région.",
      advisory: "Avis",
      watch: "Vigilance",
      warning: "Alerte",
      issued: "Émis",
      items: [
        { level: "advisory", title: "Fortes pluies dans la province de l'Ouest", text: "Plus de 40 mm de pluie sont attendus en 24 heures. Protégez les champs et les canaux de drainage." },
        { level: "watch", title: "Vents forts dans la province de l'Est", text: "Les vents pourraient atteindre 30 km/h ce soir. Fixez les structures légères." },
        { level: "warning", title: "Forte chaleur à Bugarama", text: "Les températures peuvent dépasser 32°C. Buvez souvent et évitez le soleil à midi." }
      ],
      sampleNote: "Avis illustratifs uniquement. Pas d'informations d'urgence en direct.",
      rainTitle: "Fortes pluies attendues",
      windTitle: "Vents forts attendus",
      heatTitle: "Températures élevées attendues",
      rainText: "Jusqu'à {value} mm de pluie sont prévus dans les 7 prochains jours.",
      windText: "Les vents pourraient atteindre {value} km/h.",
      heatText: "Les températures pourraient atteindre {value}°C.",
      liveNote: "Ces avis sont dérivés des données de prévision Open-Meteo."
    },
    education: {
      intro: "Apprenez-en plus sur le climat, sa mesure et la préparation.",
      articles: [
        { title: "Les saisons des pluies au Rwanda", text: "Comprenez la différence entre les saisons A, B et C et leur impact sur l'agriculture.", time: "4 min" },
        { title: "Comment lire une prévision météo", text: "Découvrez la signification des symboles de température, pluie et vent.", time: "3 min" },
        { title: "Une agriculture intelligente face au climat", text: "Des moyens simples de choisir les cultures et les périodes de plantation.", time: "5 min" }
      ],
      readTime: "min de lecture"
    },
    reports: {
      intro: "Téléchargez des rapports climatiques et agricoles pour planifier.",
      download: "Télécharger",
      items: [
        { title: "Bulletin climatique mensuel", type: "Climat", year: "2026" },
        { title: "Perspectives des pluies saisonnières", type: "Agriculture", year: "2026" },
        { title: "Conseil climatique agricole", type: "Agriculture", year: "2026" },
        { title: "Bilan climatique annuel", type: "Climat", year: "2025" }
      ],
      note: "Rapports illustratifs uniquement."
    }
  }
};

// NAVIGATION
const navigation = [
  ["home", LayoutDashboard],
  ["weather", CloudSun],
  ["rainfall", CloudRain],
  ["temperature", ThermometerSun],
  ["map", MapPin],
  ["agriculture", Sprout],
  ["alerts", ShieldCheck],
  ["education", BookOpen],
  ["reports", FileText]
];

// WEATHER ICON
function WeatherIcon({ kind, size = 24 }) {
  if (kind === "clear") {
    return <Sun size={size} />;
  }

  if (kind === "partly" || kind === "cloudy" || kind === "fog") {
    return <CloudSun size={size} />;
  }

  return <CloudRain size={size} />;
}

// DATE FORMATTING
function formatUpdated(value, language) {
  if (!value) return "";
  const locale = language === "fr" ? "fr-FR" : "en-GB";
  return value.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// APPLICATION LOGO
function Logo() {
  return (
    <div className="logo">
      <img src="/icon.svg" alt="Ikirere Cyacu" />

      <div>
        <strong>Ikirere Cyacu</strong>
        <small>Monitor · Understand · Protect</small>
      </div>
    </div>
  );
}

// SHARED PAGE HEADER
function PageHeader({ title, text }) {
  return (
    <section className="welcome">
      <span className="eyebrow">RWANDA CLIMATE PLATFORM</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}

// LOCATION SELECTOR
function LocationSelector({
  t, province, district, onProvince, onDistrict, totalDistricts
}) {
  return (
    <section className="location-panel">
      <div className="location-title">
        <MapPin size={20} />
        <strong>{t.country} — {t.map}</strong>
      </div>

      <div className="location-selectors">
        <label>
          <span>{t.selectProvince}</span>
          <select
            value={province}
            onChange={(event) => onProvince(event.target.value)}
          >
            {Object.keys(locations).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        <label>
          <span>{t.selectDistrict}</span>
          <select
            value={district}
            onChange={(event) => onDistrict(event.target.value)}
          >
            {locations[province].map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="district-count">
        5 Provinces · {totalDistricts} Districts · {t.selected}: {district}
      </p>
    </section>
  );
}

// CSV DOWNLOAD
function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// WEATHER PAGE
function WeatherPage(props) {
  const {
    t, txt, province, district, onProvince, onDistrict, totalDistricts,
    weather, status, lastUpdated, language
  } = props;
  const p = txt.weather;
  const current = weather?.current;

  const cards = [
    {
      name: t.temperature,
      value: current ? `${current.temperature_2m.toFixed(1)} °C` : "-- °C",
      icon: ThermometerSun,
      color: "orange"
    },
    {
      name: t.rainfall,
      value: current ? `${current.precipitation.toFixed(1)} mm` : "-- mm",
      icon: CloudRain,
      color: "blue"
    },
    {
      name: t.humidity,
      value: current ? `${Math.round(current.relative_humidity_2m)} %` : "-- %",
      icon: Droplets,
      color: "cyan"
    },
    {
      name: t.wind,
      value: current ? `${current.wind_speed_10m.toFixed(1)} km/h` : "-- km/h",
      icon: Wind,
      color: "purple"
    }
  ];

  const forecast = weather?.daily
    ? weather.daily.time.map((date, index) => {
        const day = new Date(`${date}T00:00:00`);
        return {
          date,
          label: p.days[(day.getDay() + 6) % 7],
          max: Math.round(weather.daily.temperature_2m_max[index]),
          min: Math.round(weather.daily.temperature_2m_min[index]),
          chance: Math.round(weather.daily.precipitation_probability_max[index] ?? 0),
          code: weather.daily.weather_code[index],
          kind: weatherKind(weather.daily.weather_code[index])
        };
      })
    : [];

  const sourceNote = status === "ready"
    ? `${t.source} · ${t.updated} ${formatUpdated(lastUpdated, language)}`
    : status === "error"
      ? t.dataError
      : t.loading;

  return (
    <>
      <PageHeader title={t.weather} text={p.intro} />

      <LocationSelector
        t={t}
        province={province}
        district={district}
        onProvince={onProvince}
        onDistrict={onDistrict}
        totalDistricts={totalDistricts}
      />

      <p className="sample"><span>ⓘ</span>{sourceNote}</p>

      <div className="section-heading">
        <h2>{p.current}</h2>
        <span>{district}</span>
      </div>

      <section className="stats-grid">
        {cards.map(({ name, value, icon: Icon, color }) => (
          <article className="stat-card" key={name}>
            <div className={`stat-icon ${color}`}>
              <Icon size={26} />
            </div>
            <div>
              <p>{name}</p>
              <h2>{value}</h2>
              <small>{status === "ready" ? t.live : status === "error" ? t.dataError : t.loading}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="panel forecast-panel">
        <div className="panel-heading">
          <div>
            <h3>{p.forecast}</h3>
            <p>{sourceNote}</p>
          </div>
          <CloudSun size={23} />
        </div>

        {forecast.length === 0 ? (
          <p className="data-state">
            {status === "error" ? t.dataError : t.loading}
          </p>
        ) : (
          <div className="forecast-grid">
            {forecast.map((day) => (
              <article className="forecast-card" key={day.date}>
                <strong>{day.label}</strong>
                <WeatherIcon kind={day.kind} size={24} />
                <span>{describeWeather(day.code, p.codes)}</span>
                <div className="forecast-temps">
                  <b>{day.max}°</b>
                  <small>{day.min}°</small>
                </div>
                <div className="forecast-rain">
                  <Droplets size={12} />
                  {day.chance}%
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// RAINFALL PAGE
function RainfallPage(props) {
  const {
    t, txt, province, district, onProvince, onDistrict, totalDistricts,
    climate, status, lastUpdated, language
  } = props;
  const p = txt.rainfall;
  const monthly = climate?.monthly || [];
  const totals = rainfallTotals(monthly);
  const rainData = monthly.map((item) => ({
    month: monthLabel(item.key, language),
    value: item.rainfall
  }));
  const seasonNames = {
    A: txt.agriculture.seasonA,
    B: txt.agriculture.seasonB,
    C: txt.agriculture.seasonC
  };
  const seasonData = buildSeasonTotals(monthly).map((item) => ({
    name: seasonNames[item.id],
    value: item.value
  }));

  const summary = [
    { name: p.annual, value: totals.total ? `${totals.total} mm` : "-- mm", icon: CloudRain, color: "blue" },
    { name: p.average, value: totals.average ? `${totals.average} mm` : "-- mm", icon: Droplets, color: "cyan" },
    {
      name: p.wettest,
      value: totals.wettest ? `${monthLabel(totals.wettest.key, language)} · ${totals.wettest.rainfall}` : "--",
      icon: TrendingUp,
      color: "orange"
    },
    {
      name: p.driest,
      value: totals.driest ? `${monthLabel(totals.driest.key, language)} · ${totals.driest.rainfall}` : "--",
      icon: Sun,
      color: "purple"
    }
  ];

  const sourceNote = status === "ready"
    ? `${t.source} · ${t.updated} ${formatUpdated(lastUpdated, language)}`
    : status === "error"
      ? t.dataError
      : t.loading;

  return (
    <>
      <PageHeader title={t.rainfall} text={p.intro} />

      <LocationSelector
        t={t}
        province={province}
        district={district}
        onProvince={onProvince}
        onDistrict={onDistrict}
        totalDistricts={totalDistricts}
      />

      <p className="sample"><span>ⓘ</span>{sourceNote}</p>

      <section className="stats-grid">
        {summary.map(({ name, value, icon: Icon, color }) => (
          <article className="stat-card" key={name}>
            <div className={`stat-icon ${color}`}>
              <Icon size={26} />
            </div>
            <div>
              <p>{name}</p>
              <h2>{value}</h2>
              <small>{p.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>{p.monthly}</h3>
              <p>{district}, {t.country}</p>
            </div>
            <CloudRain size={23} />
          </div>

          <div className="chart-container">
            {rainData.length === 0 ? (
              <p className="data-state">{status === "error" ? t.dataError : t.loading}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rainData}>
                  <defs>
                    <linearGradient id="rainPageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#168AE1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#168AE1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eee9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={p.monthly}
                    stroke="#168AE1"
                    strokeWidth={2}
                    fill="url(#rainPageGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <small className="chart-note">{p.note}</small>
        </article>

        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>{p.bySeason}</h3>
              <p>{p.note}</p>
            </div>
            <MapPin size={22} />
          </div>

          <div className="chart-container">
            {seasonData.length === 0 ? (
              <p className="data-state">{status === "error" ? t.dataError : t.loading}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eee9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name={p.bySeason} fill="#16A65C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <small className="chart-note">{p.note}</small>
        </article>
      </section>
    </>
  );
}

// TEMPERATURE PAGE
function TemperaturePage(props) {
  const {
    t, txt, province, district, onProvince, onDistrict, totalDistricts,
    climate, status, lastUpdated, language
  } = props;
  const p = txt.temperature;
  const monthly = climate?.monthly || [];
  const temperatureData = monthly.map((item) => ({
    month: monthLabel(item.key, language),
    value: item.temperature
  }));
  const totals = temperatureTotals(monthly);

  const summary = [
    {
      name: p.average,
      value: totals.average !== null ? `${totals.average} °C` : "-- °C",
      icon: ThermometerSun,
      color: "orange"
    },
    {
      name: p.highest,
      value: totals.highest !== null ? `${totals.highest} °C` : "-- °C",
      icon: Sun,
      color: "purple"
    },
    {
      name: p.lowest,
      value: totals.lowest !== null ? `${totals.lowest} °C` : "-- °C",
      icon: CloudSun,
      color: "cyan"
    },
    {
      name: p.range,
      value: totals.highest !== null
        ? `${Math.round((totals.highest - totals.lowest) * 10) / 10} °C`
        : "-- °C",
      icon: TrendingUp,
      color: "blue"
    }
  ];

  const sourceNote = status === "ready"
    ? `${t.source} · ${t.updated} ${formatUpdated(lastUpdated, language)}`
    : status === "error"
      ? t.dataError
      : t.loading;

  return (
    <>
      <PageHeader title={t.temperature} text={p.intro} />

      <LocationSelector
        t={t}
        province={province}
        district={district}
        onProvince={onProvince}
        onDistrict={onDistrict}
        totalDistricts={totalDistricts}
      />

      <p className="sample"><span>ⓘ</span>{sourceNote}</p>

      <section className="stats-grid">
        {summary.map(({ name, value, icon: Icon, color }) => (
          <article className="stat-card" key={name}>
            <div className={`stat-icon ${color}`}>
              <Icon size={26} />
            </div>
            <div>
              <p>{name}</p>
              <h2>{value}</h2>
              <small>{p.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="panel chart-panel full-panel">
        <div className="panel-heading">
          <div>
            <h3>{p.annual}</h3>
            <p>{district}, {t.country}</p>
          </div>
          <ThermometerSun size={23} />
        </div>

        <div className="chart-container">
          {temperatureData.length === 0 ? (
            <p className="data-state">{status === "error" ? t.dataError : t.loading}</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eee9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={p.average}
                  stroke="#F07847"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#F07847" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <small className="chart-note">{p.note}</small>
      </section>
    </>
  );
}

// MAP PAGE
function MapPage(props) {
  const { t, txt, province, district, onProvince, onDistrict, totalDistricts } = props;
  const p = txt.map;

  function selectDistrict(name) {
    const parent = Object.keys(locations).find((key) => locations[key].includes(name));

    if (parent && parent !== province) {
      onProvince(parent);
    }

    onDistrict(name);
  }

  return (
    <>
      <PageHeader title={t.map} text={p.intro} />

      <LocationSelector
        t={t}
        province={province}
        district={district}
        onProvince={onProvince}
        onDistrict={onDistrict}
        totalDistricts={totalDistricts}
      />

      <section className="dashboard-grid map-page-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>{t.country}</h3>
              <p>{p.hint}</p>
            </div>
            <Map size={22} />
          </div>

          <RwandaMap
            province={province}
            district={district}
            onProvince={onProvince}
            onDistrict={selectDistrict}
          />

          <div className="map-location">
            <MapPin size={21} />
            <strong>{district}, {t.country}</strong>
          </div>

          <small className="chart-note map-source">{p.source}</small>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>{p.provinces}</h3>
              <p>{p.capital}: Kigali</p>
            </div>
            <MapPin size={22} />
          </div>

          <div className="province-list">
            {Object.entries(locations).map(([name, districts]) => (
              <button
                key={name}
                className={`province-button ${province === name ? "active" : ""}`}
                onClick={() => onProvince(name)}
              >
                <span>{name}</span>
                <small>{districts.length} {t.districts}</small>
              </button>
            ))}
          </div>

          <h3 className="subheading">{p.districtList}</h3>

          <div className="district-chips">
            {locations[province].map((name) => (
              <button
                key={name}
                className={`chip ${district === name ? "active" : ""}`}
                onClick={() => selectDistrict(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

// AGRICULTURE PAGE
function AgriculturePage(props) {
  const {
    t, txt, province, district, onProvince, onDistrict, totalDistricts,
    weather, status, lastUpdated, language
  } = props;
  const p = txt.agriculture;
  const current = weather?.current;
  const month = new Date().getMonth() + 1;
  const activeSeason = month === 1 || month >= 9 ? "A" : month >= 2 && month <= 5 ? "B" : "C";
  const rain7 = weather?.daily
    ? weather.daily.precipitation_sum.reduce((sum, value) => sum + (value || 0), 0)
    : null;

  const seasons = [
    { id: "A", name: p.seasonA, months: p.seasonAMonths, description: p.seasonADesc },
    { id: "B", name: p.seasonB, months: p.seasonBMonths, description: p.seasonBDesc },
    { id: "C", name: p.seasonC, months: p.seasonCMonths, description: p.seasonCDesc }
  ];

  const cards = [
    {
      name: t.temperature,
      value: current ? `${current.temperature_2m.toFixed(1)} °C` : "-- °C",
      icon: ThermometerSun,
      color: "orange"
    },
    {
      name: t.rainfall,
      value: rain7 !== null ? `${Math.round(rain7 * 10) / 10} mm` : "-- mm",
      icon: CloudRain,
      color: "blue"
    },
    {
      name: t.humidity,
      value: current ? `${Math.round(current.relative_humidity_2m)} %` : "-- %",
      icon: Droplets,
      color: "cyan"
    },
    {
      name: t.wind,
      value: current ? `${current.wind_speed_10m.toFixed(1)} km/h` : "-- km/h",
      icon: Wind,
      color: "purple"
    }
  ];

  const sourceNote = status === "ready"
    ? `${t.source} · ${t.updated} ${formatUpdated(lastUpdated, language)}`
    : status === "error"
      ? t.dataError
      : t.loading;

  return (
    <>
      <PageHeader title={t.agriculture} text={p.intro} />

      <LocationSelector
        t={t}
        province={province}
        district={district}
        onProvince={onProvince}
        onDistrict={onDistrict}
        totalDistricts={totalDistricts}
      />

      <p className="sample"><span>ⓘ</span>{sourceNote}</p>

      <section className="stats-grid">
        {cards.map(({ name, value, icon: Icon, color }) => (
          <article className="stat-card" key={name}>
            <div className={`stat-icon ${color}`}>
              <Icon size={26} />
            </div>
            <div>
              <p>{name}</p>
              <h2>{value}</h2>
              <small>{status === "ready" ? t.live : status === "error" ? t.dataError : t.loading}</small>
            </div>
          </article>
        ))}
      </section>

      <div className="section-heading">
        <h2>{p.seasons}</h2>
        <span>{district}</span>
      </div>

      <section className="seasons-grid">
        {seasons.map((season) => (
          <article
            className={`season-card ${activeSeason === season.id ? "active" : ""}`}
            key={season.name}
          >
            <h3>{season.name}</h3>
            <span>{season.months}</span>
            <p>{season.description}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>{p.crops}</h3>
              <p>{district}, {t.country}</p>
            </div>
            <Sprout size={22} />
          </div>

          <div className="crop-chips">
            {p.cropList.map((crop) => (
              <span className="chip" key={crop}>{crop}</span>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h3>{p.tips}</h3>
              <p>{t.mission}</p>
            </div>
            <Leaf size={22} />
          </div>

          <ul className="tips-list">
            {p.tipList.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}

// ALERTS PAGE
function AlertsPage(props) {
  const { t, txt, weather, status, district, language, lastUpdated } = props;
  const p = txt.alerts;
  const alerts = buildAlerts(weather?.daily).map((alert) => {
    const title = alert.kind === "rain"
      ? p.rainTitle
      : alert.kind === "wind"
        ? p.windTitle
        : p.heatTitle;
    const template = alert.kind === "rain"
      ? p.rainText
      : alert.kind === "wind"
        ? p.windText
        : p.heatText;

    return {
      ...alert,
      title,
      text: template.replace("{value}", alert.value)
    };
  });

  const sourceNote = status === "ready"
    ? `${p.liveNote} · ${t.updated} ${formatUpdated(lastUpdated, language)}`
    : status === "error"
      ? t.dataError
      : t.loading;

  return (
    <>
      <PageHeader title={t.alerts} text={p.intro} />

      <p className="sample"><span>ⓘ</span>{sourceNote}</p>

      {alerts.length === 0 ? (
        <p className="data-state">
          {status === "ready" ? t.noAlerts : status === "error" ? t.dataError : t.loading}
        </p>
      ) : (
        <section className="alerts-list">
          {alerts.map((alert) => {
            const Icon = alert.kind === "heat"
              ? Sun
              : alert.kind === "wind"
                ? Wind
                : CloudRain;

            return (
              <article className={`alert-card ${alert.level}`} key={alert.kind}>
                <div className="alert-icon">
                  <Icon size={26} />
                </div>

                <div>
                  <span className={`badge ${alert.level}`}>{p[alert.level]}</span>
                  <h3>{alert.title}</h3>
                  <p>{alert.text}</p>
                  <small className="alert-area">{district}, {t.country}</small>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

// EDUCATION PAGE
function EducationPage(props) {
  const { t, txt } = props;
  const p = txt.education;

  return (
    <>
      <PageHeader title={t.education} text={p.intro} />

      <section className="article-grid">
        {p.articles.map((article) => (
          <article className="article-card" key={article.title}>
            <div className="article-icon">
              <BookOpen size={24} />
            </div>
            <h3>{article.title}</h3>
            <p>{article.text}</p>
            <span className="article-time">{article.time} {p.readTime}</span>
          </article>
        ))}
      </section>
    </>
  );
}

// REPORTS PAGE
function ReportsPage(props) {
  const { t, txt, weather, climate, district, language, status, lastUpdated } = props;
  const p = txt.reports;
  const monthly = climate?.monthly || [];
  const daily = weather?.daily;
  const current = weather?.current;
  const totals = rainfallTotals(monthly);
  const temperatures = temperatureTotals(monthly);
  const year = String(new Date().getFullYear());

  const reports = [
    {
      key: "monthly",
      title: p.items[0].title,
      type: p.items[0].type,
      year,
      disabled: monthly.length === 0,
      filename: `${district}-monthly-climate-${year}.csv`,
      content: toCsv([
        ["Month", "Rainfall (mm)", "Mean temperature (C)"],
        ...monthly.map((item) => [item.key, item.rainfall, item.temperature ?? ""])
      ])
    },
    {
      key: "forecast",
      title: p.items[1].title,
      type: p.items[1].type,
      year,
      disabled: !daily,
      filename: `${district}-7-day-forecast.csv`,
      content: daily
        ? toCsv([
            ["Date", "Weather code", "Max temp (C)", "Min temp (C)", "Rain (mm)", "Rain chance (%)", "Max wind (km/h)"],
            ...daily.time.map((date, index) => [
              date,
              daily.weather_code[index],
              daily.temperature_2m_max[index],
              daily.temperature_2m_min[index],
              daily.precipitation_sum[index],
              daily.precipitation_probability_max[index],
              daily.wind_speed_10m_max[index]
            ])
          ])
        : ""
    },
    {
      key: "current",
      title: p.items[2].title,
      type: p.items[2].type,
      year,
      disabled: !current,
      filename: `${district}-current-conditions.csv`,
      content: current
        ? toCsv([
            ["Metric", "Value"],
            ["District", district],
            ["Recorded at", current.time],
            ["Temperature (C)", current.temperature_2m],
            ["Humidity (%)", current.relative_humidity_2m],
            ["Precipitation (mm)", current.precipitation],
            ["Wind speed (km/h)", current.wind_speed_10m],
            ["Weather code", current.weather_code]
          ])
        : ""
    },
    {
      key: "summary",
      title: p.items[3].title,
      type: p.items[3].type,
      year,
      disabled: monthly.length === 0,
      filename: `${district}-annual-summary-${year}.csv`,
      content: toCsv([
        ["Metric", "Value"],
        ["District", district],
        ["Annual rainfall (mm)", totals.total],
        ["Average monthly rainfall (mm)", totals.average],
        ["Wettest month", totals.wettest ? `${totals.wettest.key} (${totals.wettest.rainfall} mm)` : ""],
        ["Driest month", totals.driest ? `${totals.driest.key} (${totals.driest.rainfall} mm)` : ""],
        ["Average temperature (C)", temperatures.average ?? ""],
        ["Highest monthly mean (C)", temperatures.highest ?? ""],
        ["Lowest monthly mean (C)", temperatures.lowest ?? ""]
      ])
    }
  ];

  const sourceNote = status === "ready"
    ? `${t.source} · ${t.updated} ${formatUpdated(lastUpdated, language)}`
    : status === "error"
      ? t.dataError
      : t.loading;

  return (
    <>
      <PageHeader title={t.reports} text={p.intro} />

      <p className="sample"><span>ⓘ</span>{sourceNote}</p>

      <section className="report-list">
        {reports.map((report) => (
          <article className="report-row" key={report.key}>
            <div className="report-icon">
              <FileText size={22} />
            </div>

            <div className="report-info">
              <h3>{report.title}</h3>
              <p>{report.type} · {report.year}</p>
            </div>

            <button
              className="report-download"
              onClick={() => downloadCsv(report.filename, report.content)}
              disabled={report.disabled}
            >
              {p.download}
            </button>
          </article>
        ))}
      </section>
    </>
  );
}

const pageComponents = {
  weather: WeatherPage,
  rainfall: RainfallPage,
  temperature: TemperaturePage,
  map: MapPage,
  agriculture: AgriculturePage,
  alerts: AlertsPage,
  education: EducationPage,
  reports: ReportsPage
};

// MAIN APPLICATION
export default function App() {

  const [language, setLanguage] = useState("rw");
  const [page, setPage] = useState("home");
  const [province, setProvince] = useState("Kigali City");
  const [district, setDistrict] = useState("Gasabo");
  const [menuOpen, setMenuOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [climate, setClimate] = useState(null);
  const [dataDistrict, setDataDistrict] = useState(null);
  const [errorDistrict, setErrorDistrict] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const t = translations[language];
  const txt = pageText[language];
  const CurrentPage = pageComponents[page];

  // Count all districts automatically
  const totalDistricts = useMemo(
    () => Object.values(locations).reduce(
      (total, districts) => total + districts.length,
      0
    ),
    []
  );

  // Request live weather and climate for the selected district
  useEffect(() => {
    const center = districtCenters[district];

    if (!center) {
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    Promise.all([
      fetchWeather(center.lat, center.lon, controller.signal),
      fetchClimate(center.lat, center.lon, controller.signal)
    ])
      .then(([weatherData, climateData]) => {
        if (!active) {
          return;
        }

        setWeather(weatherData);
        setClimate(climateData);
        setDataDistrict(district);
        setErrorDistrict(null);
        setLastUpdated(new Date());
      })
      .catch((error) => {
        if (!active || error.name === "AbortError") {
          return;
        }

        setWeather(null);
        setClimate(null);
        setDataDistrict(null);
        setErrorDistrict(district);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [district, refreshKey]);

  const status = dataDistrict === district
    ? "ready"
    : errorDistrict === district
      ? "error"
      : "loading";
  const liveWeather = status === "ready" ? weather : null;
  const liveClimate = status === "ready" ? climate : null;
  const current = liveWeather?.current;
  const daily = liveWeather?.daily;
  const monthly = liveClimate?.monthly || [];
  const rain7 = daily
    ? daily.precipitation_sum.reduce((sum, value) => sum + (value || 0), 0)
    : null;
  const homeRainData = monthly.map((item) => ({
    month: monthLabel(item.key, language),
    value: item.rainfall
  }));

  const sourceNote = status === "ready"
    ? `${t.source} · ${t.updated} ${formatUpdated(lastUpdated, language)}`
    : status === "error"
      ? t.dataError
      : t.loading;

  // Climate indicator cards
  const stats = [
    {
      name: t.temperature,
      value: current ? `${current.temperature_2m.toFixed(1)} °C` : "-- °C",
      icon: ThermometerSun,
      color: "orange"
    },
    {
      name: t.rainfall,
      value: rain7 !== null ? `${Math.round(rain7 * 10) / 10} mm` : "-- mm",
      icon: CloudRain,
      color: "blue"
    },
    {
      name: t.humidity,
      value: current ? `${Math.round(current.relative_humidity_2m)} %` : "-- %",
      icon: Droplets,
      color: "cyan"
    },
    {
      name: t.wind,
      value: current ? `${current.wind_speed_10m.toFixed(1)} km/h` : "-- km/h",
      icon: Wind,
      color: "purple"
    }
  ];

  // Change province and reset district
  function changeProvince(value) {
    setProvince(value);
    setDistrict(locations[value][0]);
  }

  function selectDistrict(value) {
    const parent = Object.keys(locations).find((name) => locations[name].includes(value));

    if (parent && parent !== province) {
      setProvince(parent);
    }

    setDistrict(value);
  }

  // Navigate between pages
  function navigate(value) {
    setPage(value);
    setMenuOpen(false);
  }

  const pageTitle =
    page === "home" ? t.overview : (t[page] || t.home);

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>

        <div className="sidebar-heading">

          <Logo />

          <button
            className="close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>

        </div>

        <p className="menu-label">{t.mainMenu}</p>

        <nav className="navigation">

          {navigation.map(([id, Icon]) => (

            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => navigate(id)}
              aria-current={page === id ? "page" : undefined}
            >

              <Icon size={19} />

              <span>{t[id]}</span>

              {page === id && <ChevronRight size={16} />}

            </button>

          ))}

        </nav>

        <div className="sidebar-footer">

          <Leaf size={28} />

          <strong>Twese hamwe</strong>

          <span>Turinde ibidukikije</span>

        </div>

      </aside>

      {/* MOBILE OVERLAY */}

      {menuOpen && (
        <button
          className="overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* MAIN CONTENT */}

      <main className="main">

        {/* TOP BAR */}

        <header className="topbar">

          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <div className="breadcrumb">

            <span>Ikirere Cyacu</span>

            <ChevronRight size={15} />

            <strong>{pageTitle}</strong>

          </div>

          <div className="top-actions">

            <div className="language">

              <Globe size={17} />

              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                aria-label="Select language"
              >
                <option value="rw">Kinyarwanda</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>

              <ChevronDown size={14} />

            </div>

            <button
              className="notification"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <div className="content">

          {page === "home" ? (

            <>

              {/* WELCOME */}

              <section className="welcome">

                <span className="eyebrow">
                  RWANDA CLIMATE PLATFORM
                </span>

                <h1>{t.welcome}</h1>

                <p>{t.subtitle}</p>

              </section>

              {/* HERO */}

              <section className="hero">

                <div className="hero-copy">

                  <span>IKIRERE CYACU</span>

                  <h2>
                    {district}, {t.country}
                  </h2>

                  <p>{t.subtitle}</p>

                  <button onClick={() => navigate("weather")}>
                    {t.explore}
                    <ChevronRight size={17} />
                  </button>

                </div>

                <div className="hero-sun">

                  <Sun size={95} />

                  <CloudSun size={58} />

                </div>

              </section>

              {/* DATA NOTICE */}

              <p className="sample">
                <span>ⓘ</span>
                {sourceNote}
              </p>

              {/* LOCATION SELECTOR */}

              <section className="location-panel">

                <div className="location-title">

                  <MapPin size={20} />

                  <strong>
                    {t.country} — {t.map}
                  </strong>

                </div>

                <div className="location-selectors">

                  <label>

                    <span>{t.selectProvince}</span>

                    <select
                      value={province}
                      onChange={(event) =>
                        changeProvince(event.target.value)
                      }
                    >

                      {Object.keys(locations).map((name) => (

                        <option key={name} value={name}>
                          {name}
                        </option>

                      ))}

                    </select>

                  </label>

                  <label>

                    <span>{t.selectDistrict}</span>

                    <select
                      value={district}
                      onChange={(event) =>
                        setDistrict(event.target.value)
                      }
                    >

                      {locations[province].map((name) => (

                        <option key={name} value={name}>
                          {name}
                        </option>

                      ))}

                    </select>

                  </label>

                </div>

                <p className="district-count">

                  5 Provinces · {totalDistricts} Districts ·
                  {t.selected}: {district}

                </p>

              </section>

              {/* CLIMATE CARDS */}

              <section className="stats-grid">

                {stats.map(({ name, value, icon: Icon, color }) => (

                  <article className="stat-card" key={name}>

                    <div className={`stat-icon ${color}`}>
                      <Icon size={26} />
                    </div>

                    <div>

                      <p>{name}</p>

                      <h2>{value}</h2>

                      <small>
                        {status === "ready"
                          ? t.live
                          : status === "error"
                            ? t.dataError
                            : t.loading}
                      </small>

                    </div>

                  </article>

                ))}

              </section>

              {/* DASHBOARD */}

              <section className="dashboard-grid">

                {/* RAINFALL CHART */}

                <article className="panel chart-panel">

                  <div className="panel-heading">

                    <div>

                      <h3>{t.rainfallChart}</h3>

                      <p>{district}, {t.country}</p>

                    </div>

                    <TrendingUp size={23} />

                  </div>

                  <div className="chart-container">

                    {homeRainData.length === 0 ? (
                      <p className="data-state">
                        {status === "error" ? t.dataError : t.loading}
                      </p>
                    ) : (
                    <ResponsiveContainer width="100%" height="100%">

                      <AreaChart data={homeRainData}>

                        <defs>

                          <linearGradient
                            id="rainGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >

                            <stop
                              offset="0%"
                              stopColor="#16A65C"
                              stopOpacity={0.4}
                            />

                            <stop
                              offset="100%"
                              stopColor="#16A65C"
                              stopOpacity={0.02}
                            />

                          </linearGradient>

                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e8eee9"
                        />

                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11 }}
                        />

                        <YAxis tick={{ fontSize: 11 }} />

                        <Tooltip />

                        <Area
                          type="monotone"
                          dataKey="value"
                          name={t.rainfall}
                          stroke="#13A65C"
                          strokeWidth={2}
                          fill="url(#rainGradient)"
                        />

                      </AreaChart>

                    </ResponsiveContainer>
                    )}

                  </div>

                  <small className="chart-note">
                    {t.chartNote}
                  </small>

                </article>

                {/* RWANDA MAP PLACEHOLDER */}

                <article className="panel map-panel">

                  <div className="panel-heading">

                    <h3>{t.country}</h3>

                    <Map size={22} />

                  </div>

                  <RwandaMap
                    province={province}
                    district={district}
                    onProvince={changeProvince}
                    onDistrict={selectDistrict}
                  />

                  <div className="map-location">

                    <MapPin size={21} />

                    <strong>{district}, {t.country}</strong>

                  </div>

                  <button
                    className="map-button"
                    onClick={() => navigate("map")}
                  >
                    {t.explore}
                    <ChevronRight size={16} />
                  </button>

                </article>

              </section>

              {/* ENVIRONMENTAL MISSION */}

              <section className="mission">

                <div className="mission-icon">
                  <Leaf size={30} />
                </div>

                <div>

                  <h3>{t.mission}</h3>

                  <p>{t.missionText}</p>

                </div>

                <button onClick={() => navigate("agriculture")}>

                  {t.explore}

                  <ChevronRight size={16} />

                </button>

              </section>

            </>

          ) : CurrentPage ? (

            <CurrentPage
              t={t}
              txt={txt}
              province={province}
              district={district}
              onProvince={changeProvince}
              onDistrict={setDistrict}
              totalDistricts={totalDistricts}
              weather={liveWeather}
              climate={liveClimate}
              status={status}
              lastUpdated={lastUpdated}
              language={language}
              onRetry={() => setRefreshKey((key) => key + 1)}
            />

          ) : null}

          {/* FOOTER */}

          <footer>

            <Logo />

            <p>© 2026 {t.footer}</p>

          </footer>

        </div>

      </main>

    </div>
  );
}
