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

const state = {
  tiempoRestante: DEFAULT_FOCUS_MINUTES * 60,
  timerId: null,
  itinerario: [],
  tramoActual: 0,
  enEscala: false,
  puntos: Number.parseInt(localStorage.getItem(STORAGE_KEYS.points), 10) || 0,
  vuelos: Number.parseInt(localStorage.getItem(STORAGE_KEYS.flights), 10) || 0,
  endTimestamp: null,
  isPaused: false,
  breakMinutes: DEFAULT_BREAK_MINUTES,
  distanceKm: null,
  blocksEstimados: null,
  config: {
    focusMinutes: DEFAULT_FOCUS_MINUTES,
    breakMinutes: DEFAULT_BREAK_MINUTES,
    scales: 1,
    distancePerBlock: 1000,
    soundEnabled: true,
  },
  history: [],
  cityLookup: {},
  cityLookupNormalized: {},
};

const dom = {};

function cacheDom() {
  dom.selectOrigen = document.getElementById("select-origen");
  dom.selectDestino = document.getElementById("select-destino");
  dom.selectPaquete = document.getElementById("select-paquete");
  dom.puntosVal = document.getElementById("puntos-val");
  dom.flightNumber = document.getElementById("flight-number");
  dom.rutaLista = document.getElementById("ruta-lista");
  dom.estadoVuelo = document.getElementById("estado-vuelo");
  dom.reloj = document.getElementById("reloj");
  dom.barraProgreso = document.getElementById("barra-progreso");
  dom.btnStart = document.getElementById("btn-start");
  dom.btnPause = document.getElementById("btn-pause");
  dom.btnReset = document.getElementById("btn-reset");
  dom.btnReservar = document.getElementById("btn-reservar");
  dom.toastContainer = document.getElementById("toast-container");
  dom.inputFocus = document.getElementById("input-focus");
  dom.inputBreak = document.getElementById("input-break");
  dom.inputLegs = document.getElementById("input-legs");
  dom.inputDistance = document.getElementById("input-distance");
  dom.toggleSound = document.getElementById("toggle-sound");
  dom.btnApplyConfig = document.getElementById("btn-apply-config");
  dom.toggleTheme = document.getElementById("toggle-theme");
  dom.historyList = document.getElementById("history-list");
  dom.achievementsList = document.getElementById("achievements-list");
  dom.pilotRank = document.getElementById("pilot-rank");
  dom.mapCaption = document.getElementById("map-caption");
  dom.mapStops = document.querySelectorAll(".map-stop");
  dom.distanceInfo = document.getElementById("distance-info");
  dom.blocksInfo = document.getElementById("blocks-info");
  dom.abortModal = document.getElementById("modal-abort");
  dom.abortConfirm = document.getElementById("btn-abort-confirm");
  dom.abortCancel = document.getElementById("btn-abort-cancel");
}

async function init() {
  cacheDom();
  cargarPaquetes();
  await cargarCiudades();
  cargarConfig();
  cargarHistorial();
  dom.puntosVal.textContent = state.puntos;
  actualizarReloj();
  actualizarControles();
  actualizarRank();
  actualizarLogros();
  actualizarHistorialUI();
  actualizarMapa(true);
  actualizarDistanciaUI();
  aplicarTemaGuardado();
  bindEvents();
}

function bindEvents() {
  dom.btnReservar.addEventListener("click", generarVuelo);
  dom.btnStart.addEventListener("click", iniciarVuelo);
  dom.btnPause.addEventListener("click", pausarVuelo);
  dom.btnReset.addEventListener("click", abrirModalAbortar);
  dom.btnApplyConfig.addEventListener("click", aplicarConfiguracion);
  dom.toggleTheme.addEventListener("click", alternarTema);
  dom.selectPaquete.addEventListener("change", aplicarPaquete);
  dom.abortConfirm.addEventListener("click", confirmarAbortar);
  dom.abortCancel.addEventListener("click", cerrarModalAbortar);
}

function cargarPaquetes() {
  PACKAGES.forEach((pack) => {
    dom.selectPaquete.add(new Option(pack.nombre, pack.id));
  });
}

async function cargarCiudades() {
  const cargadas = await cargarCiudadesDesdeApi();
  if (!cargadas) {
    cargarCiudadesFallback();
  }
}

function cargarCiudadesFallback() {
  const todas = [
    ...DB_REGIONES.LATAM,
    ...DB_REGIONES.EUROPA,
    ...DB_REGIONES.GLOBAL,
  ].sort();

  todas.forEach((ciudad) => {
    dom.selectOrigen.add(new Option(ciudad, ciudad));
    dom.selectDestino.add(new Option(ciudad, ciudad));
  });
}

function showNotify(msg, tipo = "info") {
  const toast = document.createElement("div");
  const claseBase =
    tipo === "error" ? "bg-red-500" : "bg-[#38a3a5]";
  toast.className = `toast p-4 rounded-xl text-white font-bold shadow-lg ${claseBase}`;
  toast.textContent = msg;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatNombre(str) {
  return str.replace(/\s\(\w+\)/, "").trim();
}

async function cargarCiudadesDesdeApi() {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all");
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    const cityMap = new Map();
    data.forEach((country) => {
      const capital = country.capital?.[0];
      const latlng = country.capitalInfo?.latlng || country.latlng;
      if (!capital || !latlng || latlng.length < 2) {
        return;
      }
      const code = country.cca3 || country.ccn3 || "INT";
      const label = `${capital} (${code})`;
      const normalized = formatNombre(label);
      cityMap.set(label, {
        label,
        normalized,
        lat: latlng[0],
        lng: latlng[1],
        region: mapearRegion(country.region),
      });
    });

    const labels = Array.from(cityMap.keys()).sort();
    labels.forEach((label) => {
      dom.selectOrigen.add(new Option(label, label));
      dom.selectDestino.add(new Option(label, label));
      const data = cityMap.get(label);
      state.cityLookup[label] = data;
      state.cityLookupNormalized[data.normalized] = data;
    });

    return true;
  } catch (error) {
    console.warn("No se pudo cargar ciudades desde API", error);
    return false;
  }
}

function cargarConfig() {
  const saved = localStorage.getItem(STORAGE_KEYS.config);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.config = { ...state.config, ...parsed };
    } catch (error) {
      console.warn("Config inválida", error);
    }
  }

  dom.inputFocus.value = state.config.focusMinutes;
  dom.inputBreak.value = state.config.breakMinutes;
  dom.inputLegs.value = state.config.scales;
  dom.inputDistance.value = state.config.distancePerBlock;
  dom.toggleSound.checked = state.config.soundEnabled;
  state.tiempoRestante = state.config.focusMinutes * 60;
  state.breakMinutes = state.config.breakMinutes;
}

function aplicarConfiguracion() {
  const focus = Number.parseInt(dom.inputFocus.value, 10);
  const rest = Number.parseInt(dom.inputBreak.value, 10);
  const scales = Number.parseInt(dom.inputLegs.value, 10);
  const distancePerBlock = Number.parseInt(dom.inputDistance.value, 10);
  const soundEnabled = dom.toggleSound.checked;

  if (!focus || !rest || Number.isNaN(scales) || !distancePerBlock) {
    showNotify("Completa la configuración con valores válidos.", "error");
    return;
  }

  state.config = {
    focusMinutes: Math.min(Math.max(focus, 15), 90),
    breakMinutes: Math.min(Math.max(rest, 5), 30),
    scales: Math.min(Math.max(scales, 0), 3),
    distancePerBlock: Math.min(Math.max(distancePerBlock, 200), 5000),
    soundEnabled,
  };

  dom.inputFocus.value = state.config.focusMinutes;
  dom.inputBreak.value = state.config.breakMinutes;
  dom.inputLegs.value = state.config.scales;
  dom.inputDistance.value = state.config.distancePerBlock;
  dom.toggleSound.checked = state.config.soundEnabled;

  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(state.config));
  showNotify("Configuración guardada.");
  abortarVuelo();
}

function aplicarTemaGuardado() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  if (saved === "night") {
    document.body.classList.add("theme-night");
  }
}

function alternarTema() {
  document.body.classList.toggle("theme-night");
  const isNight = document.body.classList.contains("theme-night");
  localStorage.setItem(STORAGE_KEYS.theme, isNight ? "night" : "day");
}

function cargarHistorial() {
  const saved = localStorage.getItem(STORAGE_KEYS.history);
  if (!saved) {
    return;
  }
  try {
    state.history = JSON.parse(saved);
  } catch (error) {
    console.warn("Historial inválido", error);
  }
}

function generarVuelo() {
  const org = dom.selectOrigen.value;
  const dest = dom.selectDestino.value;

  if (!org || !dest) {
    showNotify("Selecciona origen y destino.", "error");
    return;
  }

  if (org === dest) {
    showNotify("Selecciona destinos distintos", "error");
    return;
  }

  abortarVuelo();

  state.itinerario = generarItinerario(org, dest, state.config.scales);

  dom.flightNumber.textContent = `AF${Math.floor(
    Math.random() * 899 + 100,
  )}`;
  renderRuta();
  actualizarMapa();
  actualizarDistanciaYBloques();
  dom.estadoVuelo.textContent = "Plan de Vuelo Listo";
  showNotify("Ruta aprobada. Listo para despegar.");
  actualizarControles();
}

function aplicarPaquete(event) {
  const paquete = PACKAGES.find((pack) => pack.id === event.target.value);
  if (!paquete) {
    return;
  }
  const stops = paquete.stops;
  dom.selectOrigen.value = stops[0];
  dom.selectDestino.value = stops[stops.length - 1];
  abortarVuelo();
  state.itinerario = stops.map((stop, index) => {
    if (index === 0) {
      return { tipo: "Origen", ciudad: formatNombre(stop) };
    }
    if (index === stops.length - 1) {
      return { tipo: "Destino", ciudad: formatNombre(stop) };
    }
    return { tipo: `Escala ${index}`, ciudad: formatNombre(stop) };
  });
  dom.flightNumber.textContent = `AF${Math.floor(
    Math.random() * 899 + 100,
  )}`;
  renderRuta();
  actualizarMapa();
  actualizarDistanciaYBloques();
  dom.estadoVuelo.textContent = "Plan de Vuelo Listo";
  showNotify(`Paquete cargado: ${paquete.nombre}`);
  actualizarControles();
}

function renderRuta() {
  dom.rutaLista.innerHTML = state.itinerario
    .map((tramo, index) => {
      const icono =
        index < state.tramoActual
          ? "✅"
          : index === state.tramoActual
            ? "✈️"
            : "🔘";
      const clase =
        index === state.tramoActual
          ? "tramo-activo"
          : "text-slate-400 text-xs";

      return `
        <li class="${clase} flex items-center gap-2">
          ${icono} ${tramo.tipo}: ${tramo.ciudad}
        </li>
      `;
    })
    .join("");
}

function iniciarVuelo() {
  if (state.itinerario.length === 0) {
    showNotify("Reserva un vuelo primero", "error");
    return;
  }

  if (state.timerId) {
    showNotify("El motor ya está en marcha");
    return;
  }

  iniciarTimer();
}

function pausarVuelo() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
    state.endTimestamp = null;
    state.isPaused = true;
    dom.estadoVuelo.textContent = "Vuelo en Pausa";
    showNotify("Vuelo pausado temporalmente.");
    actualizarControles();
    return;
  }

  if (state.isPaused) {
    showNotify("Reanudando vuelo.");
    iniciarTimer();
    return;
  }

  showNotify("No hay vuelo en progreso.");
}

function abrirModalAbortar() {
  if (state.itinerario.length === 0) {
    showNotify("No hay misión activa.");
    return;
  }
  dom.abortModal.classList.remove("hidden");
}

function cerrarModalAbortar() {
  dom.abortModal.classList.add("hidden");
}

function confirmarAbortar() {
  cerrarModalAbortar();
  abortarVuelo();
}

function iniciarTimer() {
  if (state.timerId) {
    return;
  }

  state.isPaused = false;
  if (state.enEscala) {
    dom.estadoVuelo.textContent = `☕ Escala en ${obtenerCiudadEscala()} · ${state.breakMinutes} min`;
    reproducirSonido("break");
  } else {
    dom.estadoVuelo.textContent = "✈️ Volando hacia el destino";
    reproducirSonido("start");
  }

  state.endTimestamp = Date.now() + state.tiempoRestante * 1000;
  state.timerId = setInterval(() => {
    const restante = Math.max(
      0,
      Math.ceil((state.endTimestamp - Date.now()) / 1000),
    );
    if (restante > 0) {
      state.tiempoRestante = restante;
      actualizarReloj();
      return;
    }

    clearInterval(state.timerId);
    state.timerId = null;
    state.endTimestamp = null;
    tramoFinalizado();
  }, 1000);

  actualizarControles();
}

function actualizarReloj() {
  const minutos = Math.floor(state.tiempoRestante / 60)
    .toString()
    .padStart(2, "0");
  const segundos = (state.tiempoRestante % 60).toString().padStart(2, "0");
  dom.reloj.textContent = `${minutos}:${segundos}`;

  const total = state.enEscala
    ? state.breakMinutes * 60
    : state.config.focusMinutes * 60;
  dom.barraProgreso.style.width = `${
    ((total - state.tiempoRestante) / total) * 100
  }%`;
}

function tramoFinalizado() {
  if (!state.enEscala) {
    state.puntos += POINTS_PER_FOCUS;
    localStorage.setItem(STORAGE_KEYS.points, state.puntos);
    dom.puntosVal.textContent = state.puntos;
    actualizarRank();
    actualizarLogros();
    state.tramoActual += 1;

    const siguiente = state.itinerario[state.tramoActual];
    if (!siguiente) {
      showNotify("¡Misión cumplida! Has llegado a destino.", "success");
      reproducirSonido("complete");
      registrarVuelo();
      abortarVuelo();
    } else if (siguiente.tipo.startsWith("Escala")) {
      state.enEscala = true;
      state.breakMinutes = calcularEscalaMinutos();
      state.tiempoRestante = state.breakMinutes * 60;
      showNotify(
        `Escala en ${obtenerCiudadEscala()}. Descansa ${state.breakMinutes} min.`,
      );
      iniciarTimer();
    } else if (siguiente.tipo === "Destino") {
      showNotify("¡Misión cumplida! Has llegado a destino.", "success");
      reproducirSonido("complete");
      registrarVuelo();
      abortarVuelo();
    }
  } else {
    state.enEscala = false;
    state.tramoActual += 1;
    if (state.tramoActual >= state.itinerario.length) {
      showNotify("¡Misión cumplida! Has llegado a destino.", "success");
      reproducirSonido("complete");
      registrarVuelo();
      abortarVuelo();
      return;
    }
    state.tiempoRestante = state.config.focusMinutes * 60;
    showNotify("Descanso terminado. ¡A volar!");
    iniciarTimer();
  }

  renderRuta();
  actualizarMapa();
  actualizarDistanciaUI();
}

function abortarVuelo() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.endTimestamp = null;
  state.isPaused = false;
  state.itinerario = [];
  state.tramoActual = 0;
  state.enEscala = false;
  state.tiempoRestante = state.config.focusMinutes * 60;
  state.breakMinutes = state.config.breakMinutes;
  actualizarReloj();
  dom.rutaLista.innerHTML =
    '<li class="text-slate-400 text-xs italic text-center py-8">No hay ruta activa</li>';
  dom.estadoVuelo.textContent = "Check-in Requerido";
  actualizarMapa(true);
  actualizarDistanciaUI();
  actualizarControles();
}

function actualizarControles() {
  dom.btnPause.disabled = !state.timerId && !state.isPaused;
  dom.btnStart.disabled =
    state.itinerario.length === 0 || state.timerId || state.isPaused;
  dom.btnReset.disabled = state.itinerario.length === 0;
  dom.btnPause.textContent = state.isPaused ? "REANUDAR" : "PAUSA";
}

function obtenerCiudadEscala() {
  const escalaActual = state.itinerario[state.tramoActual];
  if (escalaActual?.tipo?.startsWith("Escala")) {
    return escalaActual.ciudad;
  }
  const escala = state.itinerario.find((item) => item.tipo.startsWith("Escala"));
  return escala ? escala.ciudad : "Escala Técnica";
}

function calcularEscalaMinutos() {
  const variacion = Math.floor(Math.random() * (BREAK_VARIATION + 1));
  const base = Math.max(state.config.breakMinutes - 1, 4);
  return base + variacion;
}

function generarItinerario(origen, destino, escalas) {
  const regionOrigen = obtenerRegion(origen);
  const regionDestino = obtenerRegion(destino);
  const esIntercontinental = regionOrigen && regionDestino && regionOrigen !== regionDestino;
  const escalasReales = escalas;

  let candidatos = [];
  if (esIntercontinental) {
    const regionesAlternas = Object.keys(DB_REGIONES).filter(
      (region) => region !== regionOrigen && region !== regionDestino,
    );
    candidatos = regionesAlternas.flatMap((region) => DB_REGIONES[region]);
    candidatos = candidatos.filter((c) => c !== origen && c !== destino);
  } else {
    const region = regionOrigen || "LATAM";
    candidatos = (DB_REGIONES[region] || []).filter(
      (c) => c !== origen && c !== destino,
    );
  }

  const escalasSeleccionadas = seleccionarEscalasPorDistancia(
    origen,
    destino,
    candidatos,
    escalasReales,
  );

  const ruta = [{ tipo: "Origen", ciudad: formatNombre(origen) }];
  escalasSeleccionadas.forEach((ciudad, index) => {
    ruta.push({ tipo: `Escala ${index + 1}`, ciudad: formatNombre(ciudad) });
  });
  ruta.push({ tipo: "Destino", ciudad: formatNombre(destino) });
  return ruta;
}

function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function obtenerRegion(ciudad) {
  const lookup = state.cityLookup[ciudad];
  if (lookup?.region) {
    return lookup.region;
  }
  const normalized = formatNombre(ciudad);
  const lookupNormalized = state.cityLookupNormalized[normalized];
  if (lookupNormalized?.region) {
    return lookupNormalized.region;
  }
  return Object.keys(DB_REGIONES).find((region) =>
    DB_REGIONES[region].includes(ciudad),
  );
}

function mapearRegion(region) {
  if (region === "Europe") return "EUROPA";
  if (region === "Americas") return "LATAM";
  return "GLOBAL";
}

function actualizarDistanciaYBloques() {
  state.distanceKm = calcularDistanciaTotal();
  if (state.distanceKm) {
    state.blocksEstimados = Math.max(
      1,
      Math.ceil(state.distanceKm / state.config.distancePerBlock),
    );
  } else {
    state.blocksEstimados = null;
  }
  actualizarDistanciaUI();
}

function actualizarDistanciaUI() {
  if (state.distanceKm) {
    dom.distanceInfo.textContent = `Distancia: ${Math.round(
      state.distanceKm,
    ).toLocaleString("es-AR")} km`;
    dom.blocksInfo.textContent = `Bloques estimados: ${state.blocksEstimados}`;
  } else {
    dom.distanceInfo.textContent = "Distancia: -- km";
    dom.blocksInfo.textContent = "Bloques estimados: --";
  }
}

function calcularDistanciaTotal() {
  if (state.itinerario.length < 2) {
    return null;
  }
  let total = 0;
  for (let i = 0; i < state.itinerario.length - 1; i += 1) {
    const start = obtenerCoordenadas(state.itinerario[i].ciudad);
    const end = obtenerCoordenadas(state.itinerario[i + 1].ciudad);
    if (!start || !end) {
      return null;
    }
    total += calcularHaversineKm(start, end);
  }
  return total;
}

function obtenerCoordenadas(ciudad) {
  const lookup = state.cityLookup[ciudad];
  if (lookup) {
    return { lat: lookup.lat, lng: lookup.lng };
  }
  const normalized = formatNombre(ciudad);
  const normalizedLookup = state.cityLookupNormalized[normalized];
  if (normalizedLookup) {
    return { lat: normalizedLookup.lat, lng: normalizedLookup.lng };
  }
  return null;
}

function calcularHaversineKm(origen, destino) {
  const rad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = rad(destino.lat - origen.lat);
  const dLng = rad(destino.lng - origen.lng);
  const lat1 = rad(origen.lat);
  const lat2 = rad(destino.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function seleccionarEscalasPorDistancia(origen, destino, candidatos, escalas) {
  if (escalas <= 0 || candidatos.length === 0) {
    return [];
  }

  const origenCoords = obtenerCoordenadas(origen);
  const destinoCoords = obtenerCoordenadas(destino);
  if (!origenCoords || !destinoCoords) {
    return shuffleArray(candidatos).slice(0, escalas);
  }

  const restantes = candidatos.filter(
    (c) => c !== origen && c !== destino,
  );
  const distanciaTotal = calcularHaversineKm(origenCoords, destinoCoords);

  if (escalas === 1) {
    const candidatosConDist = restantes
      .map((ciudad) => {
        const coords = obtenerCoordenadas(ciudad);
        if (!coords) return null;
        return {
          ciudad,
          distOrigen: calcularHaversineKm(origenCoords, coords),
        };
      })
      .filter(Boolean);

    const rangoMin = distanciaTotal * 0.2;
    const rangoMax = distanciaTotal * 0.7;
    const enRango = candidatosConDist
      .filter((item) => item.distOrigen >= rangoMin && item.distOrigen <= rangoMax)
      .sort((a, b) => a.distOrigen - b.distOrigen);
    if (enRango.length > 0) {
      return [enRango[0].ciudad];
    }

    candidatosConDist.sort((a, b) => a.distOrigen - b.distOrigen);
    return candidatosConDist.slice(0, 1).map((item) => item.ciudad);
  }

  const escalasSeleccionadas = [];
  let distanciaRestante = distanciaTotal;

  for (let i = 0; i < escalas; i += 1) {
    const objetivoRestante = distanciaTotal * (1 - (i + 1) / (escalas + 1));
    const candidatosOrdenados = restantes
      .filter((ciudad) => !escalasSeleccionadas.includes(ciudad))
      .map((ciudad) => {
        const coords = obtenerCoordenadas(ciudad);
        if (!coords) return null;
        return {
          ciudad,
          distDestino: calcularHaversineKm(coords, destinoCoords),
        };
      })
      .filter(Boolean)
      .filter((item) => item.distDestino < distanciaRestante)
      .sort((a, b) => {
        const scoreA = Math.abs(a.distDestino - objetivoRestante);
        const scoreB = Math.abs(b.distDestino - objetivoRestante);
        return scoreA - scoreB;
      });

    if (candidatosOrdenados.length === 0) {
      break;
    }

    const elegido = candidatosOrdenados[0];
    escalasSeleccionadas.push(elegido.ciudad);
    distanciaRestante = elegido.distDestino;
  }

  return escalasSeleccionadas;
}

function actualizarMapa(reset = false) {
  const totalStops = state.itinerario.length || 0;
  dom.mapStops.forEach((stop, index) => {
    if (reset || index >= totalStops) {
      stop.setAttribute("fill", "#94a3b8");
      stop.setAttribute("opacity", index === 0 ? "1" : "0.2");
      return;
    }
    if (index < state.tramoActual) {
      stop.setAttribute("fill", "#57cc99");
    } else if (index === state.tramoActual) {
      stop.setAttribute("fill", "#22577a");
    } else {
      stop.setAttribute("fill", "#94a3b8");
    }
    stop.setAttribute("opacity", "1");
  });

  if (reset || totalStops === 0) {
    dom.mapCaption.textContent = "Ruta en espera.";
  } else {
    const actual = state.itinerario[state.tramoActual];
    dom.mapCaption.textContent = `${actual.tipo}: ${actual.ciudad}`;
  }
}

function registrarVuelo() {
  const now = new Date();
  const ruta = state.itinerario
    .map((item) => `${item.tipo} ${item.ciudad}`)
    .join(" → ");
  const entry = {
    fecha: now.toLocaleDateString("es-AR"),
    ruta,
    puntos: POINTS_PER_FOCUS,
  };
  state.history.unshift(entry);
  state.history = state.history.slice(0, 10);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
  state.vuelos += 1;
  localStorage.setItem(STORAGE_KEYS.flights, state.vuelos);
  actualizarHistorialUI();
  actualizarRank();
  actualizarLogros();
}

function actualizarHistorialUI() {
  if (state.history.length === 0) {
    dom.historyList.innerHTML =
      '<li class="text-slate-400 text-xs italic">Sin vuelos registrados.</li>';
    return;
  }

  dom.historyList.innerHTML = state.history
    .map(
      (item) =>
        `<li><span class="font-bold">${item.fecha}</span> · ${item.ruta} · ${item.puntos} millas</li>`,
    )
    .join("");
}

function actualizarRank() {
  const puntos = state.puntos;
  let rank = "Cadete";
  if (puntos >= 5000) rank = "Comandante";
  else if (puntos >= 2500) rank = "Capitán";
  else if (puntos >= 1000) rank = "Primer Oficial";
  dom.pilotRank.textContent = `Rango: ${rank}`;
}

function actualizarLogros() {
  const logros = [
    { label: "Primer vuelo completado", done: state.vuelos >= 1 },
    { label: "3 vuelos completados", done: state.vuelos >= 3 },
    { label: "1000 millas acumuladas", done: state.puntos >= 1000 },
    { label: "5000 millas acumuladas", done: state.puntos >= 5000 },
  ];

  dom.achievementsList.innerHTML = logros
    .map(
      (logro) =>
        `<li class="${logro.done ? "text-emerald-600" : "text-slate-400"}">${
          logro.done ? "✅" : "⬜"
        } ${logro.label}</li>`,
    )
    .join("");
}

function reproducirSonido(tipo) {
  if (!state.config.soundEnabled) {
    return;
  }
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value =
    tipo === "complete" ? 660 : tipo === "break" ? 520 : 440;
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

document.addEventListener("DOMContentLoaded", init);
