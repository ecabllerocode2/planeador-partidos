import { useState, useEffect, useMemo } from 'react'; 
import { Routes, Route, useLocation } from 'react-router-dom';

// Importaciones de Componentes
import Footer from "./components/Footer";
import Header from "./components/Header"
import JornadaCard from "./components/JornadaCard"
import PartidoDetail from "./components/PartidoDetail";
import ModalSubidaArchivos from "./components/ModalSubidaArchivos";
import StatsView from './components/StatsView';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth'; 
import { getFirestore, collection, onSnapshot, query, orderBy, type DocumentData, getDocs, type Firestore } from 'firebase/firestore'; 

// Importaciones de React Icons
import { IoMdAddCircle } from "react-icons/io";
import { IoFootball } from "react-icons/io5";

import LoginView from './components/LoginView'; 

// ====================================================================
// DECLARACIÓN DE VARIABLES GLOBALES e INTERFACES
// ====================================================================

declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | null | undefined;

// *******************************************************************
// 🔑 PASO 1: DEFINE TU UID DE ADMINISTRADOR AQUÍ
// *******************************************************************
const ADMIN_UID = "1C6xrXnZiJgfb1CUCrHSvbyd1om1"; 
// *******************************************************************

// INTERFACES (Dejamos las interfaces fuera para que el código sea 100% copiable)
export interface Planeacion {
  id_planeacion: string;
  arbitro_creador: string;
  fecha_creacion: Date | string;
  partido_referencia: string;
  objetivos: string[];
  aspectos_clave_reglas: string[];
  datos_equipo_local: { [key: string]: any };
  datos_equipo_visitante: { [key: string]: any };
  coordinacion_arbitral: { [key: string]: any };
  prediccion: { [key: string]: any };
}

export interface Sancion {
  categoria: string; 
  nombre: string;
  equipo: string;
  rol: string;
}

export interface Partido {
  local: string;
  visitante: string;
  categoria: string;
  arbitro_central: string;
  arbitro_linea_1?: string;
  arbitro_linea_2?: string;
  campo: string; // Sede
  fecha: string; // Día/Fecha
  hora: string;
  planeacion?: Planeacion;
}

export interface JornadaData {
  id: string;
  fechaExtraccion: string;
  partidos: Partido[];
  jornadaId: string;
  estadoPlaneacion?: 'PENDIENTE' | 'PARCIAL' | 'COMPLETA';
  ultimaPlaneacion?: Date | string;
  sanciones?: Sancion[];
}

export interface StatsCache {
  [categoria: string]: {
    standings: { equipo: string; posicion: string | number;[key: string]: any }[];
    [key: string]: any;
  };
}


const JORNADAS_COLLECTION = 'jornadas';
const STATS_COLLECTION = 'stats_cache';

// FUNCIÓN DE CONFIGURACIÓN DE FIREBASE 
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
      return JSON.parse(__firebase_config);
    } catch (e) {
      console.error("Error al parsear __firebase_config.");
    }
  }
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }
  return {};
};


// ====================================================================
// COMPONENTE PRINCIPAL APP
// ====================================================================

function App() {
  const location = useLocation();

  const [jornadas, setJornadas] = useState<JornadaData[]>([]);
  const [statsCache, setStatsCache] = useState<StatsCache>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<Firestore | null>(null); 

  // ESTADOS DE AUTENTICACIÓN
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Lógica de navegación
  const isHome = location.pathname === '/';
  const showFabAndFooter = isHome || location.pathname === '/stats';

  const isSuperUser = useMemo(() => user?.uid === ADMIN_UID, [user]);

  // --- EFECTO 1: Inicialización de Firebase y Auth Listener (Solo Auth) ---
  useEffect(() => {
    const firebaseConfig = getFirebaseConfig();

    if (!firebaseConfig || !firebaseConfig.apiKey) {
      setError("Error: La configuración de Firebase no está disponible.");
      setIsLoading(false);
      setIsAuthReady(true);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      // Inicializamos Firestore y lo guardamos
      setDb(getFirestore(app)); 
      const auth = getAuth(app);

      // 1. Listener de Autenticación
      const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
        setUser(authUser);
        setIsAuthReady(true);
      });
      
      // 2. Limpieza
      return () => unsubscribeAuth();

    } catch (e) {
      console.error("Error al inicializar Firebase:", e);
      setError("Error crítico al inicializar Firebase. Revise su configuración.");
      setIsLoading(false);
      setIsAuthReady(true);
      setDb(null);
    }
  }, []); // Se ejecuta solo una vez al montar

  
  // --- EFECTO 2: Carga de Datos (Depende de 'user' y 'db') ---
  useEffect(() => {
    let unsubscribeJornadas: () => void | undefined;

    // Solo procede si el usuario está logueado y la DB está disponible
    if (user && db) { 
        setIsLoading(true);
        setError(null);

        // 1. Listener para JORNADAS
        const jornadasCollectionRef = collection(db, JORNADAS_COLLECTION);
        const q = query(jornadasCollectionRef, orderBy('fechaExtraccion', 'desc'));

        unsubscribeJornadas = onSnapshot(q, (snapshot) => {
            const fetchedJornadas: JornadaData[] = [];
            snapshot.forEach(doc => {
              const data = doc.data() as DocumentData;
              fetchedJornadas.push({
                id: doc.id,
                fechaExtraccion: data.fechaExtraccion as string,
                jornadaId: data.jornadaId as string,
                partidos: data.partidos as Partido[] || [],
                estadoPlaneacion: data.estadoPlaneacion as JornadaData['estadoPlaneacion'],
                ultimaPlaneacion: data.ultimaPlaneacion as JornadaData['ultimaPlaneacion'],
                sanciones: data.sanciones as Sancion[] || [],
              });
            });

            setJornadas(fetchedJornadas);
            setIsLoading(false);
            setError(null); 
        }, (err) => {
            console.error("Firestore Listener Error (Jornadas):", err);
            setError(`Error al cargar las jornadas: ${err.message}`);
            setIsLoading(false);
        });
        
        // 2. Carga Única de la Colección STATS_CACHE
        const loadStatsCache = async () => {
            try {
                const statsCollectionRef = collection(db, STATS_COLLECTION);
                const statsSnapshot = await getDocs(statsCollectionRef);
                const cache: StatsCache = {};
                statsSnapshot.forEach(doc => {
                    cache[doc.id] = doc.data() as StatsCache[string];
                });
                setStatsCache(cache);
            } catch(err) {
                console.error("Error al cargar StatsCache:", err);
            }
        };
        loadStatsCache();
    } else {
        // Limpia el estado si el usuario no está logueado
        setJornadas([]);
        setStatsCache({});
        setIsLoading(true);
    }

    // 3. Limpieza del listener
    return () => {
        if (unsubscribeJornadas) {
            unsubscribeJornadas();
        }
    };
  }, [user, db]); // Se ejecuta cada vez que 'user' o 'db' cambia


  // --- MANEJO DE VISTAS (LOGIN VS APP COMPLETA) ---

  // 1. Mostrar loader de sesión
  if (!isAuthReady) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-gray-700">Cargando sesión...</p>
        </div>
    );
  }
  
  // 2. Mostrar la vista de login si NO hay un usuario autenticado
  if (!user) {
    return (
      <LoginView 
        onLogin={setUser} 
        onError={setAuthError} 
        error={authError}
      />
    );
  }

  // --- Si el usuario está logueado, se renderiza la aplicación completa ---
  
  // Manejo del título del Header
  const headerTitle = isHome
    ? "PLANEACIÓN ARBITRAL"
    : location.pathname === '/stats'
      ? "CLASIFICACIONES"
      : "DETALLE DEL PARTIDO";

  // Función local para limpiar el estado de React después de cerrar sesión
  const handleLogoutLocal = () => {
    setUser(null); 
    setAuthError(null);
    // El useEffect de carga de datos limpia el resto del estado al ver que user es null
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header con props de autenticación */}
      <Header 
        titulo={headerTitle} 
        onLogout={handleLogoutLocal} 
        isUserLoggedIn={!!user}
      />

      <main className={`flex-grow p-4 md:p-6 lg:p-8 relative ${showFabAndFooter ? 'pb-20' : ''}`}>

        <Routes>
          {/* 1. Ruta principal: Lista de Jornadas (Home) */}
          <Route path="/" element={
            <>
              {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4 font-medium">
                  🚨 {error}
                </div>
              )}

              {isLoading && !error && (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando jornadas...
                </div>
              )}

              {!isLoading && !jornadas.length && !error && (
                <div className="p-8 text-center bg-white rounded-lg shadow-sm text-gray-500">
                  <IoFootball className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className='font-semibold'>No hay jornadas cargadas.</p>
                  {isSuperUser && (
                     <p className='text-sm'>Presiona el botón (+) para subir un archivo de partidos.</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {jornadas.map((jornada) => (
                  <JornadaCard key={jornada.id} jornada={jornada} />
                ))}
              </div>
            </>
          } />

          {/* 2. Ruta: Detalle de Partido */}
          <Route
            path="/partido/:partidoId"
            element={
              <PartidoDetail
                jornadas={jornadas}
                isLoading={isLoading}
                statsCache={statsCache}
                isSuperUser={isSuperUser}
                db={db}
              />
            }
          />

          {/* 3. NUEVA RUTA: Estadísticas */}
          <Route
            path="/stats"
            element={<StatsView statsCache={statsCache} />}
          />

        </Routes>
      </main>

      {/* FAB (Botón de Acción Flotante) */}
      {isHome && isSuperUser && (
        <button
          onClick={openModal}
          aria-label="Agregar Nueva Planeación"
          className="fixed bottom-20 right-10
                      text-6xl text-emerald-500 hover:text-emerald-600 transition-colors 
                      shadow-lg rounded-full z-50"
        >
          <IoMdAddCircle />
        </button>
      )}

      {showFabAndFooter && (
        <Footer currentPath={location.pathname} />
      )}

      {/* Modal de Subida de Archivos */}
      {isSuperUser && (
        <ModalSubidaArchivos
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default App;