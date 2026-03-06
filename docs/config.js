const DB_COORDENADAS = {
  "Buenos Aires": { lat: -34.6037, lng: -58.3816 },
  "Santiago": { lat: -33.4489, lng: -70.6693 },
  "Brasilia": { lat: -15.8267, lng: -47.9218 },
  "Lima": { lat: -12.0464, lng: -77.0428 },
  "Bogotá": { lat: 4.7110, lng: -74.0721 },
  "Asunción": { lat: -25.2637, lng: -57.5759 },
  "Montevideo": { lat: -34.9011, lng: -56.1645 },
  "San José": { lat: 9.9281, lng: -84.0907 },
  "Ciudad de México": { lat: 19.4326, lng: -99.1332 },
  "Quito": { lat: -0.1807, lng: -78.4678 },
  "Caracas": { lat: 10.4806, lng: -66.9036 },
  "La Paz": { lat: -16.4897, lng: -68.1193 },
  "Madrid": { lat: 40.4168, lng: -3.7038 },
  "Londres": { lat: 51.5074, lng: -0.1278 },
  "París": { lat: 48.8566, lng: 2.3522 },
  "Berlín": { lat: 52.5200, lng: 13.4050 },
  "Roma": { lat: 41.9028, lng: 12.4964 },
  "Lisboa": { lat: 38.7223, lng: -9.1393 },
  "Ámsterdam": { lat: 52.3676, lng: 4.9041 },
  "Atenas": { lat: 37.9838, lng: 23.7275 },
  "Tokio": { lat: 35.6762, lng: 139.6503 },
  "Pekín": { lat: 39.9042, lng: 116.4074 },
  "Washington D.C.": { lat: 38.9072, lng: -77.0369 },
  "Ottawa": { lat: 45.4215, lng: -75.6972 },
  "El Cairo": { lat: 30.0444, lng: 31.2357 },
  "Doha": { lat: 25.2854, lng: 51.5310 },
  "Bangkok": { lat: 13.7563, lng: 100.5018 },
  "Nairobi": { lat: -1.2921, lng: 36.8219 }
};

const DB_REGIONES = {
  LATAM: [
    "Buenos Aires (ARG)",
    "Santiago (CHL)",
    "Brasilia (BRA)",
    "Lima (PER)",
    "Bogotá (COL)",
    "Asunción (PRY)",
    "Montevideo (URY)",
    "San José (CRI)",
    "Ciudad de México (MEX)",
    "Quito (ECU)",
    "Caracas (VEN)",
    "La Paz (BOL)",
  ],
  EUROPA: [
    "Madrid (ESP)",
    "Londres (GBR)",
    "París (FRA)",
    "Berlín (GER)",
    "Roma (ITA)",
    "Lisboa (PRT)",
    "Ámsterdam (NLD)",
    "Atenas (GRC)",
  ],
  GLOBAL: [
    "Tokio (JPN)",
    "Pekín (CHN)",
    "Washington D.C. (USA)",
    "Ottawa (CAN)",
    "El Cairo (EGY)",
    "Doha (QAT)",
    "Bangkok (THA)",
    "Nairobi (KEN)",
  ],
};

const DEFAULT_FOCUS_MINUTES = 45;
const DEFAULT_BREAK_MINUTES = 10;
const POINTS_PER_FOCUS = 500;
const BREAK_VARIATION = 3;
const STORAGE_KEYS = {
  points: "puntos",
  history: "historial",
  flights: "vuelos",
  config: "config",
  theme: "theme",
};

const PACKAGES = [
  {
    id: "euro-trip",
    nombre: "Gran Tour Europa",
    stops: [
      "Madrid (ESP)",
      "París (FRA)",
      "Roma (ITA)",
      "Berlín (GER)",
      "Londres (GBR)",
    ],
  },
  {
    id: "latam-loop",
    nombre: "Circuito Sudamericano",
    stops: [
      "Buenos Aires (ARG)",
      "Santiago (CHL)",
      "Lima (PER)",
      "Bogotá (COL)",
      "Ciudad de México (MEX)",
    ],
  },
  {
    id: "world-connector",
    nombre: "Conexión Intercontinental",
    stops: [
      "Madrid (ESP)",
      "El Cairo (EGY)",
      "Doha (QAT)",
      "Bangkok (THA)",
      "Tokio (JPN)",
    ],
  },
];
