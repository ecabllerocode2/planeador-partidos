import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; 

// Importaciones de Componentes
import Footer from "./components/Footer";
import Header from "./components/Header"
import JornadaCard from "./components/JornadaCard"
import PartidoDetail from "./components/PartidoDetail"; 
import ModalSubidaArchivos from "./components/ModalSubidaArchivos";

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore'; 

// Importaciones de React Icons
import { IoMdAddCircle } from "react-icons/io"; 
import { IoFootball } from "react-icons/io5"; 

// ====================================================================
// DECLARACIÓN DE VARIABLES GLOBALES (Para el entorno de GitHub Codespaces/Canvas)
// ====================================================================
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | null | undefined;


// ====================================================================
// INTERFACES (Exportadas)
// ====================================================================

export interface Partido {
  asistente1: string;
  asistente2: string;
  categoria: string;
  central: string;
  dia: string;
  hora: string;
  jornada: string;
  local: string;
  sede: string;
  visitante: string;
}

export interface JornadaData {
  id: string; 
  // 🚨 CAMBIO DE NOMBRE DE LA INTERFACE
  fechaExtraccion: string; 
  partidos: Partido[]; 
  jornada: string; 
}

const JORNADAS_COLLECTION = 'jornadas';

// ====================================================================
// FUNCIÓN DE CONFIGURACIÓN DE FIREBASE
// ====================================================================
const getFirebaseConfig = () => {
    // 1. Intentar usar la configuración inyectada por el entorno (si existe)
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        try {
            return JSON.parse(__firebase_config);
        } catch (e) {
            console.error("Error al parsear __firebase_config.");
        }
    }

    // 2. Usar las variables de entorno de VITE (definidas en .env o Vercel)
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
    
    // 3. Objeto vacío si no hay configuración disponible
    return {};
};


// ====================================================================
// COMPONENTE PRINCIPAL APP
// ====================================================================

function App() {
  const location = useLocation(); 
  
  const [jornadas, setJornadas] = useState<JornadaData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  const isHome = location.pathname === '/'; 
  const showFabAndFooter = isHome;
  
  
  // --- EFECTO: Inicialización de Firebase y Conexión a Firestore ---
  useEffect(() => {
    // Obtener configuración usando la función que prioriza VITE/dotenv
    const firebaseConfig = getFirebaseConfig();
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    
    // Si falta la clave API, mostramos error
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      setError("Error: La configuración de Firebase no está disponible. Verifique el archivo .env o las variables de Vercel.");
      setIsLoading(false);
      return;
    }
    
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const auth = getAuth(app);
      
      // 2. Autenticación anónima/con token
      const authenticate = async () => {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        } catch (authError) {
            console.error("Error de autenticación, cayendo a anónimo:", authError);
            // Intenta de nuevo con anónimo en caso de que el token sea inválido
            await signInAnonymously(auth); 
        }
      };
      authenticate();
      
      // 3. Crear query y Listener (onSnapshot)
      const jornadasCollectionRef = collection(db, JORNADAS_COLLECTION);
      // 🚨 QUERY CORREGIDA: Usamos 'fechaExtraccion'
      const q = query(jornadasCollectionRef, orderBy('fechaExtraccion', 'desc')); 
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedJornadas: JornadaData[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as Omit<JornadaData, 'id'>;
          
          fetchedJornadas.push({
            id: doc.id,
            // 🚨 CAMBIO DE CAMPO: Usamos 'fechaExtraccion'
            fechaExtraccion: data.fechaExtraccion, 
            jornada: data.jornada, 
            partidos: data.partidos || [],
          });
        });
        
        setJornadas(fetchedJornadas);
        setIsLoading(false);
        setError(null);
      }, (err) => {
        console.error("Firestore Listener Error:", err);
        setError(`Error al cargar las jornadas: ${err.message}`);
        setIsLoading(false);
      });
      
      return () => unsubscribe(); // Limpieza del listener al desmontar
      
    } catch (e) {
      console.error("Error al inicializar Firebase:", e);
      setError("Error crítico al inicializar Firebase. Revise su configuración.");
      setIsLoading(false);
    }
  }, []); // Se ejecuta solo una vez al montar


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header titulo={isHome ? "PLANEACIÓN ARBITRAL" : "DETALLE DEL PARTIDO"} />
      
      <main className={`flex-grow p-4 md:p-6 lg:p-8 relative ${showFabAndFooter ? 'pb-20' : ''}`}> 
        
        <Routes>
          {/* Ruta principal: Lista de Jornadas */}
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
          
          {/* Ruta: Detalle de Partido */}
          <Route path="/partido/:partidoId" element={<PartidoDetail />} /> 

        </Routes>
      </main>
      
      {showFabAndFooter && (
        <>
          {/* Botón de Acción Flotante (FAB) */}
          <button 
          onClick={openModal}
            aria-label="Agregar Nueva Planeación"
            className="fixed bottom-10 right-10 
                       text-6xl text-emerald-500 hover:text-emerald-600 transition-colors 
                       shadow-lg rounded-full z-50"
          >
            <IoMdAddCircle />
          </button>
          <Footer />
        </>
      )}
      <ModalSubidaArchivos 
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}

export default App
