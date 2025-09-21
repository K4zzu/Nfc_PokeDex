import React, { useEffect, useMemo, useRef, useState } from "react";

/* =========================
   Config & Utils
========================= */

const POKEMON_MAX_ID = 898;
const PAGE_SIZE = 20;

function pokeImageUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// Mapeo opcional de serial NFC -> ID
const SERIAL_TO_POKEMON = {
  // "04:A2:B1:11:22:33:44": 25,
};

function parsePokemonIdFromText(text) {
  if (!text) return null;
  const direct = text.match(/\b(\d{1,4})\b/);
  if (direct) {
    const id = parseInt(direct[1], 10);
    if (id >= 1 && id <= POKEMON_MAX_ID) return id;
  }
  const urlMatch = text.match(/pokemon\/(\d{1,4})/i);
  if (urlMatch) {
    const id = parseInt(urlMatch[1], 10);
    if (id >= 1 && id <= POKEMON_MAX_ID) return id;
  }
  return null;
}

// 👉 Nuevo: leer ID desde la URL (case-insensitive, soporta trailing slash)
function getPokemonIdFromURL() {
  const { pathname, search } = window.location;

  // Soporta /pokemon/25 o /POKEMON/25, con o sin slash final
  const m = pathname.match(/\/pokemon\/(\d{1,4})\/?$/i);
  if (m) {
    const id = parseInt(m[1], 10);
    if (id >= 1 && id <= POKEMON_MAX_ID) return id;
  }

  // Soporta ?id=25 o ?pokemon=25
  const sp = new URLSearchParams(search);
  const q = sp.get("id") || sp.get("pokemon");
  if (q && /^\d{1,4}$/.test(q)) {
    const id = parseInt(q, 10);
    if (id >= 1 && id <= POKEMON_MAX_ID) return id;
  }
  return null;
}

function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

/* =========================
   Sound System (base64 placeholders)
========================= */
// Reemplaza los data URIs por tus propios sonidos si quieres.
const SND = {
  click: "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA...",
  success: "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA...",
  error: "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA...",
  pop: "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAA...",
};

function useSound() {
  const play = (name, { volume = 0.5 } = {}) => {
    const src = SND[name];
    if (!src) return;
    const a = new Audio(src);
    a.volume = volume;
    a.play().catch(() => {});
  };
  return { play };
}

/* =========================
   UI Components
========================= */

function DexHeader({ totalCaptured, lastId }) {
  return (
    <header className="sticky top-0 z-20">
      {/* Barra roja estilo Pokédex */}
      <div className="bg-red-600 border-b-8 border-red-700">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
          {/* Luces (ocultas en XS) */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-400 dex-light" style={{ color: "#38bdf8" }} />
            <div className="w-3 h-3 rounded-full bg-amber-400 dex-light" style={{ color: "#fbbf24" }} />
            <div className="w-3 h-3 rounded-full bg-lime-400 dex-light" style={{ color: "#a3e635" }} />
            <div className="w-3 h-3 rounded-full bg-rose-400 dex-light" style={{ color: "#fb7185" }} />
          </div>
          <h1
            className="font-bold tracking-wide text-white text-sm sm:text-xl text-center flex-1"
            style={{ fontFamily: "'Press Start 2P', system-ui" }}
          >
            PokéNFC Dex By Kazµ
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm bg-black/70 text-white px-2 sm:px-3 py-1 rounded-full">
              {totalCaptured} capturados
            </span>
            {lastId && (
              <span className="hidden sm:inline text-xs sm:text-sm bg-yellow-400 text-black px-3 py-1 rounded-full">
                Último: #{lastId}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Franja negra finita como bisagra */}
      <div className="h-2 bg-black/80"></div>
    </header>
  );
}

function ControlButton({ children, className = "", onClick, sound, sounder, ...props }) {
  return (
    <button
      className={`btn-dex px-4 py-2 rounded-full text-white font-semibold active:scale-[0.98] transition ${className}`}
      onClick={(e) => {
        sounder?.play(sound || "click");
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function PokemonCard({ id, captured, data, loading, cardRef, highlighted, onOpen }) {
  const type = data?.types?.[0]?.type?.name || "normal";
  const img = pokeImageUrl(id);

  // handlers de accesibilidad para abrir con teclado si está capturado
  const handleKey = (e) => {
    if (!captured) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen?.(id);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`card-watermark relative rounded-2xl p-3 border-4 shadow transition 
      ${captured ? `bg-white border-pokemon-${type}` : "bg-gray-100 border-gray-300"}
      ${highlighted ? "ring-4 ring-yellow-300 animate-pulse" : ""}
      ${captured ? "cursor-pointer hover:scale-[1.01]" : "cursor-default"}`}
      role={captured ? "button" : undefined}
      tabIndex={captured ? 0 : -1}
      aria-label={captured ? `Abrir Pokémon ${data?.name || "#" + id}` : `Pokémon no capturado #${id}`}
      onClick={() => captured && onOpen?.(id)}
      onKeyDown={handleKey}
      title={captured ? "Abrir detalles" : "Aún no capturado"}
    >
      <div className="text-[10px] sm:text-xs absolute right-2 top-2 bg-black/80 text-white px-2 py-0.5 rounded-full">
        #{id.toString().padStart(3, "0")}
      </div>

      <div className="flex items-center justify-center h-28">
        {captured ? (
          loading ? (
            <div className="h-24 w-24 rounded-full border-4 border-gray-300 border-t-transparent animate-spin" />
          ) : (
            <img
              src={img}
              alt={data?.name || `Pokemon ${id}`}
              className="h-24 object-contain drop-shadow animate-[pop_300ms_ease]"
              style={{ animationName: "pop" }}
            />
          )
        ) : (
          <div className="h-24 w-24 rounded-full bg-gradient-to-b from-gray-300 to-gray-200 border border-gray-400" />
        )}
      </div>

      <div className="mt-2 text-center font-bold capitalize" style={{ fontFamily: "'Press Start 2P', system-ui" }}>
        {captured ? (loading ? "Cargando…" : data?.name || "Desconocido") : "???"}
      </div>

      {captured && !loading && data?.types && (
        <div className="text-center text-xs mt-1">
          {data.types.map((t) => (
            <span
              key={t.type.name}
              className={`px-2 py-0.5 rounded-full text-white bg-pokemon-${t.type.name} mr-1`}
            >
              {t.type.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ open, onClose, data, id, sounder }) {
  if (!open) return null;
  const img = id ? pokeImageUrl(id) : null;
  const type = data?.types?.[0]?.type?.name || "normal";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={() => {
          sounder?.play("pop");
          onClose();
        }}
      />
      <div
        className="relative max-w-md w-full bg-white rounded-2xl border-4 animate-scaleIn"
        style={{ borderColor: `var(--tw-color-pokemon-${type})` }}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold capitalize" style={{ fontFamily: "'Press Start 2P', system-ui" }}>
            {data ? "Pokémon" : "Cargando…"}
          </h3>
          <button
            onClick={() => {
              sounder?.play("click");
              onClose();
            }}
            className="text-gray-600 hover:text-black text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <img src={img} alt={data?.name} className="h-24 w-24 object-contain animate-[pop_300ms_ease]" />
            <div>
              <div className="text-xl font-bold capitalize">
                {data?.name || "—"} <span className="text-gray-500">#{id}</span>
              </div>
              <div className="mt-1">
                {data?.types?.map((t) => (
                  <span
                    key={t.type.name}
                    className={`px-2 py-0.5 rounded-full text-white bg-pokemon-${t.type.name} mr-1 text-xs`}
                  >
                    {t.type.name}
                  </span>
                ))}
              </div>
              {data && (
                <div className="text-sm text-gray-700 mt-2">
                  <div>
                    Peso: {(data.weight / 10).toFixed(1)} kg • Altura: {(data.height / 10).toFixed(1)} m
                  </div>
                </div>
              )}
            </div>
          </div>
          {data?.stats && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {data.stats.slice(0, 6).map((s) => (
                <div key={s.stat.name} className="flex justify-between bg-gray-50 rounded-lg px-2 py-1">
                  <span className="capitalize">{s.stat.name.replace("-", " ")}</span>
                  <span className="font-semibold">{s.base_stat}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t text-right">
          <button
            onClick={() => {
              sounder?.play("pop");
              onClose();
            }}
            className="btn-dex bg-red-600 text-white px-4 py-2 rounded-full"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main App
========================= */

export default function App() {
  const { play } = useSound();
  const nfcSupported = typeof window !== "undefined" && "NDEFReader" in window;

  const [captured, setCaptured] = useLocalStorageState("pokedex.captured", {}); // { [id]: true }
  const [pokemonData, setPokemonData] = useState({}); // { [id]: data }
  const [loadingData, setLoadingData] = useState({}); // { [id]: boolean }
  const [highlightedIds, setHighlightedIds] = useState({}); // { [id]: true }
  const [log, setLog] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [lastId, setLastId] = useState(null);

  // Paginación y búsqueda
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(POKEMON_MAX_ID / PAGE_SIZE);
  const [query, setQuery] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [modalData, setModalData] = useState(null);
  const pendingScrollIdRef = useRef(null); // ID a scrollear tras cerrar modal

  // Refs por tarjeta para scrollear
  const cardRefs = useRef({}); // { [id]: el }
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const addLog = (msg) => setLog((l) => [...l, { ts: new Date().toLocaleTimeString(), msg }]);
  const totalCaptured = useMemo(() => Object.keys(captured).length, [captured]);

  const fetchPokemon = async (id) => {
    if (loadingData[id]) return pokemonData[id];
    try {
      setLoadingData((s) => ({ ...s, [id]: true }));
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPokemonData((prev) => ({ ...prev, [id]: data }));
      return data;
    } catch (e) {
      console.error("Error fetching #" + id, e);
      addLog(`⚠️ Error obteniendo datos de Pokémon #${id}`);
      play("error");
      return null;
    } finally {
      setLoadingData((s) => ({ ...s, [id]: false }));
    }
  };

  // Capturar y mostrar modal (escaneo o simulación)
  const captureAndShow = async (id) => {
    setCaptured((prev) => ({ ...prev, [id]: true }));
    setLastId(id);
    addLog(`✅ Capturado Pokémon #${id}`);
    play("success");

    // Guarda el ID para scrollear cuando cierres el modal
    pendingScrollIdRef.current = id;

    // Abre el modal sin esperar a que captured[id] se actualice aún
    await openPokemon(id, { skipCapturedCheck: true });
  };

  // Abrir detalles de un Pokémon (desde tarjeta o desde captura)
  const openPokemon = async (id, { skipCapturedCheck = false } = {}) => {
    if (!skipCapturedCheck && !captured[id]) {
      // Solo bloquea si el usuario intenta abrir una tarjeta no capturada
      play("error");
      return;
    }
    let data = pokemonData[id];
    if (!data) data = await fetchPokemon(id);
    setModalId(id);
    setModalData(data);
    setModalOpen(true);
  };

  // 👉 NUEVO: capturar al entrar por URL y soportar back/forward
  useEffect(() => {
    const id = getPokemonIdFromURL();
    if (id) {
      // Registra y abre modal al entrar con una URL /pokemon/ID o ?id=ID
      captureAndShow(id);
      // (opcional) centra la tarjeta en la grilla
      setTimeout(() => scrollToId(id), 200);
    }

    const onPop = () => {
      const id2 = getPokemonIdFromURL();
      if (id2) {
        openPokemon(id2, { skipCapturedCheck: true });
      } else {
        setModalOpen(false);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNFCReading = (event) => {
    const { serialNumber, message } = event;
    addLog(`📶 Etiqueta leída. Serial: ${serialNumber || "(desconocido)"}`);

    // Si hay mapeo por serial
    if (serialNumber && SERIAL_TO_POKEMON[serialNumber]) {
      const id = SERIAL_TO_POKEMON[serialNumber];
      const base = `${window.location.origin}`;
      const url = `${base}/pokemon/${id}`;
      if (window.location.href !== url) {
        window.history.pushState({}, "", url);
      }
      captureAndShow(id);
      return;
    }

    // Intentar parsear registros NDEF
    if (message?.records?.length) {
      for (const record of message.records) {
        try {
          let text = null;
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder(record.encoding || "utf-8");
            text = textDecoder.decode(record.data);
          } else if (record.recordType === "url") {
            const textDecoder = new TextDecoder("utf-8");
            text = textDecoder.decode(record.data);
          } else if (record.data) {
            const textDecoder = new TextDecoder("utf-8");
            text = textDecoder.decode(record.data);
          }
          if (text) {
            addLog(`🧾 Payload: ${text}`);
            const id = parsePokemonIdFromText(text);
            if (id) {
              const base = `${window.location.origin}`;
              const url = `${base}/pokemon/${id}`;
              if (window.location.href !== url) {
                window.history.pushState({}, "", url);
              }
              captureAndShow(id);
              return;
            }
          }
        } catch (e) {
          console.error(e);
          addLog("⚠️ Error al leer el registro NDEF");
          play("error");
        }
      }
    }
    addLog("❓ No se pudo extraer un ID de Pokémon de la etiqueta.");
  };

  const startScan = async () => {
    if (!nfcSupported) {
      addLog("Tu navegador no soporta Web NFC. Usa Chrome/Edge en Android.");
      play("error");
      return;
    }
    try {
      const ndef = new NDEFReader();
      addLog("Acerque una etiqueta NFC al teléfono…");
      setScanning(true);
      play("click");
      await ndef.scan();
      ndef.onreading = handleNFCReading;
      ndef.onreadingerror = () => { addLog("⚠️ Error leyendo la etiqueta. Intenta de nuevo."); play("error"); };
    } catch (e) {
      console.error(e);
      addLog("🚫 Permiso denegado o error iniciando el escaneo.");
      play("error");
      setScanning(false);
    }
  };

  const stopScan = () => { setScanning(false); addLog("⏹️ Escaneo detenido."); play("click"); };

  const resetPokedex = () => {
    if (confirm("¿Borrar tu progreso de la Pokédex?")) {
      setCaptured({}); setLastId(null); setPokemonData({}); setLoadingData({}); setHighlightedIds({});
      addLog("🧹 Progreso reiniciado.");
      play("click");
    }
  };

  // Paginación y grid
  const firstId = (page - 1) * PAGE_SIZE + 1;
  const lastIdOnPage = Math.min(page * PAGE_SIZE, POKEMON_MAX_ID);
  const gridIds = Array.from({ length: lastIdOnPage - firstId + 1 }, (_, i) => firstId + i);

  // Scroll a ID (cambia página si hace falta y luego scrollIntoView)
  const scrollToId = (id) => {
    if (id < 1 || id > POKEMON_MAX_ID) return;
    const targetPage = Math.ceil(id / PAGE_SIZE);
    const doScroll = () => {
      const el = cardRefs.current[id];
      if (el?.scrollIntoView) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // resaltar tarjeta
        setHighlightedIds((prev) => ({ ...prev, [id]: true }));
        setTimeout(() => {
          setHighlightedIds((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }, 1500);
      }
    };
    if (targetPage !== page) {
      setPage(targetPage);
      setTimeout(doScroll, 120);
    } else {
      doScroll();
    }
  };

  // Cerrar modal -> scrollear a la tarjeta que acabamos de capturar
  const closeModal = () => {
    setModalOpen(false);
    const id = pendingScrollIdRef.current;
    if (id) {
      scrollToId(id);            // navega a la página y centra la tarjeta
      pendingScrollIdRef.current = null;
    }
    play("pop");
  };

  // Buscar por ID o nombre
  const resolveIdByName = async (nameOrId) => {
    const key = String(nameOrId).trim().toLowerCase();
    if (!key) return null;
    if (/^\d+$/.test(key)) {
      const id = parseInt(key, 10);
      return id >= 1 && id <= POKEMON_MAX_ID ? id : null;
    }
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.id || null;
    } catch {
      return null;
    }
  };

  const onSearch = async (e) => {
    e?.preventDefault?.();
    const id = await resolveIdByName(query);
    if (id) {
      play("click");
      if (captured[id] && !pokemonData[id]) fetchPokemon(id);
      scrollToId(id);
      // Si ya está capturado, abrir modal directamente
      if (captured[id]) openPokemon(id);
    } else {
      addLog("🔎 No se encontró ese Pokémon por nombre/ID.");
      play("error");
    }
  };

  /* =========================
     Render
  ========================= */

  return (
    <div className="min-h-screen pokeball-bg text-gray-900 overflow-x-hidden">
      <DexHeader totalCaptured={totalCaptured} lastId={lastId} />

      <main className="container mx-auto px-3 sm:px-4 py-4">
        {/* Controles superiores (responsive) */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Grupo izquierdo: acciones principales */}
          <div className="flex flex-wrap gap-2">
            {!scanning ? (
              <ControlButton
                sounder={{ play }}
                sound="click"
                onClick={startScan}
                className="bg-red-600 hover:brightness-110"
              >
                {nfcSupported ? "Iniciar escaneo" : "NFC no soportado"}
              </ControlButton>
            ) : (
              <ControlButton
                sounder={{ play }}
                sound="click"
                onClick={stopScan}
                className="bg-rose-600 hover:brightness-110"
              >
                Detener escaneo
              </ControlButton>
            )}
            <ControlButton
              sounder={{ play }}
              className="bg-blue-600 hover:brightness-110"
              onClick={() => {
                const value = prompt("Ingresa un ID de Pokémon (1-898)");
                const id = parseInt(value || "", 10);
                if (!isNaN(id) && id >= 1 && id <= POKEMON_MAX_ID) {
                  // Al simular, también normalizamos la URL
                  const base = `${window.location.origin}`;
                  const url = `${base}/pokemon/${id}`;
                  if (window.location.href !== url) {
                    window.history.pushState({}, "", url);
                  }
                  captureAndShow(id);
                } else {
                  alert("ID inválido");
                  play("error");
                }
              }}
            >
              Simular
            </ControlButton>
            <ControlButton sounder={{ play }} className="bg-gray-800 hover:brightness-110" onClick={resetPokedex}>
              Reiniciar
            </ControlButton>
          </div>

          {/* Grupo derecho: búsqueda + paginación compacta */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <form onSubmit={onSearch} className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o ID…"
                className="px-3 py-2 rounded-xl text-white border w-64 max-w-full focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              />
              <button className="btn-dex  bg-emerald-600 text-white px-4 py-2 rounded-full" type="submit">
                Buscar
              </button>
            </form>

            <div className="flex items-center gap-2 justify-end">
              <button
                className="btn-dex bg-gray-700 text-white px-3 py-1 rounded-full disabled:opacity-40"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  play("click");
                }}
                disabled={page === 1}
              >
                ◀
              </button>
              <span className="text-sm text-white whitespace-nowrap">
                Página {page}/{totalPages}
              </span>
              <button
                className="btn-dex bg-gray-700 text-white px-3 py-1 rounded-full disabled:opacity-40"
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  play("click");
                }}
                disabled={page === totalPages}
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetas de info + bloques solicitados */}
        <section className="mb-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 bg-white/95 backdrop-blur shadow border-2 border-red-600">
            <h2 className="font-bold mb-2" style={{ fontFamily: "'Press Start 2P', system-ui" }}>
              Escaneo NFC
            </h2>
            <p className="text-sm text-gray-600 mb-3">Requiere Chrome/Edge en Android en HTTPS (o localhost).</p>
            <p className="text-xs text-gray-500">Al capturar, se abrirá un modal con la información.</p>
          </div>

          {/* 🔒 Bloque EXACTO restaurado */}
          {/* <div className="rounded-2xl p-4 bg-white/95 backdrop-blur shadow border-2 border-yellow-400">
            <h2 className="font-bold mb-2" style={{fontFamily: "'Press Start 2P', system-ui"}}>Vincular serial → Pokémon</h2>
            <p className="text-sm text-gray-700">
              Programa tus tags con texto (p.ej. <code>POKEMON:25</code>) o URL (<code>…/pokemon/25</code>).
              También puedes mapear el <code>serialNumber</code> en <code>SERIAL_TO_POKEMON</code>.
            </p>
          </div> */}

          <div className="rounded-2xl p-4 bg-white/95 backdrop-blur shadow border-2 border-lime-400">
            <h2 className="font-bold mb-2" style={{fontFamily: "'Press Start 2P', system-ui"}}>Registro</h2>
            <div ref={logRef} className="h-32 overflow-auto text-sm bg-gray-50 rounded-xl p-2 border">
              {log.length === 0 ? (
                <div className="text-gray-500">Sin eventos aún…</div>
              ) : (
                log.map((l, i) => (
                  <div key={i} className="whitespace-pre-wrap"><span className="text-gray-400">[{l.ts}]</span> {l.msg}</div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Título de rango visible */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-white" style={{ fontFamily: "'Press Start 2P', system-ui" }}>
            Pokédex ({(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, POKEMON_MAX_ID)})
          </h2>
        </div>

        {/* Grid de la Pokédex */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {gridIds.map((id) => (
            <PokemonCard
              key={id}
              id={id}
              captured={!!captured[id]}
              data={captured[id] ? pokemonData[id] : null}
              loading={!!loadingData[id]}
              cardRef={(el) => (cardRefs.current[id] = el)}
              highlighted={!!highlightedIds[id]}
              onOpen={openPokemon}
            />
          ))}
        </div>
      </main>

      {/* Modal de captura / detalle */}
      <Modal open={modalOpen} onClose={closeModal} data={modalData} id={modalId} sounder={{ play }} />

      {/* Barra flotante en móvil */}
      <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 sm:hidden">
        {!scanning ? (
          <button
            onClick={startScan}
            className="btn-dex rounded-full w-14 h-14 bg-red-600 text-white grid place-items-center shadow-xl active:scale-95"
            aria-label="Iniciar escaneo"
          >
            📡
          </button>
        ) : (
          <button
            onClick={stopScan}
            className="btn-dex rounded-full w-14 h-14 bg-rose-600 text-white grid place-items-center shadow-xl active:scale-95"
            aria-label="Detener escaneo"
          >
            ⏹
          </button>
        )}
        <button
          onClick={() => {
            const value = prompt("Ingresa un ID de Pokémon (1-898)");
            const id = parseInt(value || "", 10);
            if (!isNaN(id) && id >= 1 && id <= POKEMON_MAX_ID) {
              const base = `${window.location.origin}`;
              const url = `${base}/pokemon/${id}`;
              if (window.location.href !== url) {
                window.history.pushState({}, "", url);
              }
              captureAndShow(id);
            } else { alert("ID inválido"); play("error"); }
          }}
          className="btn-dex rounded-full w-14 h-14 bg-blue-600 text-white grid place-items-center shadow-xl active:scale-95"
          aria-label="Simular captura"
        >
          🎯
        </button>
        <button
          onClick={resetPokedex}
          className="btn-dex rounded-full w-14 h-14 bg-gray-800 text-white grid place-items-center shadow-xl active:scale-95"
          aria-label="Reiniciar"
        >
          ♻️
        </button>
      </div>

      <footer className="container mx-auto px-3 sm:px-4 py-4 text-center text-[10px] sm:text-xs text-gray-600">
        Hecho By Kazµ with ♥
      </footer>
    </div>
  );
}
