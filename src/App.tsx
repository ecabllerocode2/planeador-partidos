import { useState, useEffect } from 'react';
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
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, orderBy, type DocumentData, getDocs } from 'firebase/firestore'; 

// Importaciones de React Icons
import { IoMdAddCircle } from "react-icons/io"; 
import { IoFootball } from "react-icons/io5"; 

// ====================================================================
// DECLARACIÓN DE VARIABLES GLOBALES
// ====================================================================
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | null | undefined;


// ====================================================================
// INTERFACES (EXPORTADAS PARA USO EN OTROS COMPONENTES)
// ====================================================================

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
}

// Interfaz para la caché de estadísticas
export interface StatsCache {
    [categoria: string]: { 
        standings: { equipo: string; posicion: string | number; [key: string]: any }[];
        [key: string]: any;
    };
}


const JORNADAS_COLLECTION = 'jornadas';
const STATS_COLLECTION = 'stats_cache';

// ====================================================================

// FUNCIÓN DE CONFIGURACIÓN DE FIREBASE 
const getFirebaseConfig = () => {
    // ... (Lógica de configuración de Firebase sin cambios)
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

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const isHome = location.pathname === '/'; 
  
  // ✅ MANTENEMOS la variable original para controlar el FOOTER y el relleno.
  // showFabAndFooter es TRUE en '/' y en '/stats' (y se usa para el padding del main)
  const showFabAndFooter = isHome || location.pathname === '/stats'; 
  
  
  // --- EFECTO: Inicialización de Firebase y Conexión a Firestore (sin cambios) ---
  useEffect(() => {
    const firebaseConfig = getFirebaseConfig();
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      setError("Error: La configuración de Firebase no está disponible.");
      setIsLoading(false);
      return;
    }
    
    let db: any;
    
    try {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app); 
      const auth = getAuth(app);
      
      const authenticate = async () => {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        } catch (authError) {
            console.error("Error de autenticación, cayendo a anónimo:", authError);
            await signInAnonymously(auth); 
        }
      };
      authenticate();
      
      
      // 3. Listener (onSnapshot) para JORNADAS
      const jornadasCollectionRef = collection(db, JORNADAS_COLLECTION);
      const q = query(jornadasCollectionRef, orderBy('fechaExtraccion', 'desc')); 
      
      const unsubscribeJornadas = onSnapshot(q, (snapshot) => {
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
      
      
      // 4. Carga Única de la Colección STATS_CACHE
      const loadStatsCache = async () => {
          try {
              const statsCollectionRef = collection(db, STATS_COLLECTION);
              const statsSnapshot = await getDocs(statsCollectionRef);
              const cache: StatsCache = {};
              
              statsSnapshot.forEach(doc => {
                  cache[doc.id] = doc.data() as StatsCache[string];
              });
              
              setStatsCache(cache);
              console.log(`[App.tsx] StatsCache cargado: ${Object.keys(cache).length} categorías.`);
          } catch(err) {
              console.error("Error al cargar StatsCache:", err);
          }
      };
      
      loadStatsCache();
      
      // Limpieza de los listeners
      return () => {
        unsubscribeJornadas();
      }; 
      
    } catch (e) {
      console.error("Error al inicializar Firebase:", e);
      setError("Error crítico al inicializar Firebase. Revise su configuración.");
      setIsLoading(false);
    }
  }, []); 


  // Manejo del título del Header
  const headerTitle = isHome 
      ? "PLANEACIÓN ARBITRAL" 
      : location.pathname === '/stats' 
      ? "CLASIFICACIONES" 
      : "DETALLE DEL PARTIDO";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header titulo={headerTitle} />
      
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
                  <p className='text-sm'>Presiona el botón (+) para subir un archivo de partidos.</p>
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
      
      {/* ✅ MODIFICACIÓN: Separamos la lógica del FAB. 
        El FAB solo se muestra si isHome es TRUE (ruta '/')
      */}
      {isHome && (
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

      {/* ✅ MANTENEMOS la renderización del FOOTER usando la variable original.
        showFabAndFooter es TRUE en '/' y en '/stats' 
      */}
      {showFabAndFooter && (
        <Footer currentPath={location.pathname} />
      )}
      
      <ModalSubidaArchivos 
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}

export default App