import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Importaciones de Firebase - FUNCIONES
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // No necesitamos doc ni onSnapshot aquí
// Importación de Firebase - TIPOS/INTERFACES
import type { User } from 'firebase/auth'; 

// ✅ CORRECCIÓN CLAVE: Importamos todos los tipos de App.tsx, incluyendo Planeacion
import type { JornadaData, Partido, Planeacion } from '../App';


// ====================================================================
// DECLARACIÓN DE VARIABLES GLOBALES (Para el entorno de GitHub Codespaces/Canvas)
// ====================================================================
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | null | undefined;


// ====================================================================
// ÍCONOS SVG INLINE
// ====================================================================
const SvgIcon = ({ path, className = 'w-5 h-5', style = {} }: { path: string, className?: string, style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
    </svg>
);
const ArrowBackIcon = (props: any) => ( <SvgIcon path="M19 12H5M12 19l-7-7 7-7" {...props} /> ); 
const BuildIcon = (props: any) => ( <SvgIcon path="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-2.2-2.2L7.5 14H4v-3.5l1.6-1.6L8 8.13" {...props} /> ); 
const ListIcon = (props: any) => ( <SvgIcon path="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" {...props} /> ); 
const PeopleIcon = (props: any) => ( <SvgIcon path="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2M15 9a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...props} /> );
const BulbIcon = (props: any) => ( <SvgIcon path="M12 18V6M12 6a4 4 0 0 1 4-4 4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6a4 4 0 0 1 4 4 4 4 0 0 1 4-4" {...props} /> );
const CodeIcon = (props: any) => ( <SvgIcon path="M16 18l4-4-4-4M8 6l-4 4 4 4M12 2l-1 20" {...props} /> ); 
const PulseIcon = (props: any) => ( <SvgIcon path="M14 6L8 18M2 12h4l2 5 3-10 3 10 2-5h4" {...props} /> ); 
const AlertCircleIcon = (props: any) => ( <SvgIcon path="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 14h.01M12 8v4" {...props} /> );


// ====================================================================
// INTERFACES Y CONSTANTES
// ====================================================================
// 🛑 NOTA: Eliminamos la interfaz Planeacion duplicada, ya se importa de App.tsx

// Usamos el tipo Partido (importado de App.tsx) y lo extendemos para el detalle.
interface PartidoData extends Partido { 
    planeacion?: Planeacion; 
}


const JORNADAS_COLLECTION = 'jornadas';

// IMPORTANTE: REEMPLAZA ESTA URL CON LA URL REAL DE TU BACKEND DE VERCEL
const API_BASE_URL = 'https://planeador-partidos-backend.vercel.app'; 


// ====================================================================
// FUNCIÓN DE CONFIGURACIÓN DE FIREBASE (REPLICADA DESDE APP.TSX)
// ====================================================================
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
// DEFINICIÓN DE PROPS PARA EL COMPONENTE
// ====================================================================
interface PartidoDetailProps {
    jornadas: JornadaData[];
    isLoading: boolean; // Indica si el componente padre (App) está cargando data de Firestore
}


// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

const PartidoDetail: React.FC<PartidoDetailProps> = ({ jornadas, isLoading: isAppLoading }) => {
    
    const { partidoId: idRutaCompleto } = useParams<{ partidoId: string }>(); 
    const navigate = useNavigate();

    // 1. Estados de Firebase/Auth (Se mantienen para la función `generarPlaneacion`)
    // No necesitamos dbInstance aquí, solo el userId para el endpoint
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // 2. Descomponer el ID de la ruta
    const [jornadaId, setJornadaId] = useState<string | null>(null);
    const [partidoIndex, setPartidoIndex] = useState<number | null>(null);
    
    // 3. Estado de la Data y UI
    const [partidoData, setPartidoData] = useState<PartidoData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false); 
    const [error, setError] = useState<string | null>(null);


    // --- EFECTO 1: Inicialización de Firebase y Auth ---
    useEffect(() => {
        const firebaseConfig = getFirebaseConfig();
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (!Object.keys(firebaseConfig).length) {
            console.error("Firebase config is missing.");
            setError("Error: La configuración de Firebase no está disponible.");
            setIsAuthReady(true);
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            // const db = getFirestore(app); // No necesitamos la instancia de DB aquí
            const auth = getAuth(app);
            // setDbInstance(db); // Eliminado

            const authenticate = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (authError) {
                    console.error("Error during authentication, falling back to anonymous:", authError);
                    await signInAnonymously(auth);
                }
            };
    
            const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    // Usar un ID de sesión anónimo si no hay autenticación, para la referencia
                    setUserId(crypto.randomUUID()); 
                }
                setIsAuthReady(true);
            });
    
            authenticate();
            return () => unsubscribe();
        } catch (initError) {
            console.error("Error during Firebase initialization in PartidoDetail:", initError);
            setError("Error crítico al iniciar Firebase en el detalle del partido.");
            setIsAuthReady(true);
        }
    }, []); 

    // --- EFECTO 2: Descomponer ID de Ruta ---
    useEffect(() => {
        if (idRutaCompleto) {
            // El formato esperado es "JornadaID-ÍndicePartido"
            const parts = idRutaCompleto.split('-');
            if (parts.length === 2 && !isNaN(Number(parts[1]))) {
                setJornadaId(parts[0]);
                setPartidoIndex(Number(parts[1]));
                setError(null); // Limpiar error si el ID es válido
            } else {
                setError("Error: El formato del ID del partido no es válido (Ej: J01-1).");
            }
        }
    }, [idRutaCompleto]);


    // --- EFECTO 3: Búsqueda del Partido usando las Props (Reemplaza el onSnapshot redundante) ---
    useEffect(() => {
        // Solo intentamos buscar si la carga principal terminó
        if (isAppLoading || !jornadas.length) {
            setPartidoData(null);
            return;
        }

        if (jornadaId && partidoIndex !== null) {
            // Buscamos el documento de jornada por su 'id' (que es el doc.id de Firestore)
            const jornada = jornadas.find(j => j.id === jornadaId);
            
            if (jornada) {
                const partido = jornada.partidos[partidoIndex];
                
                if (partido) {
                    // Usamos el partido encontrado, le añadimos el campo planeacion (si existe)
                    setPartidoData(partido as PartidoData);
                    setError(null);
                } else {
                    setError(`Error: El partido con índice ${partidoIndex} no existe en la jornada.`);
                    setPartidoData(null);
                }
            } else {
                setError(`Error: Documento de Jornada ${jornadaId} no encontrado en la lista principal.`);
                setPartidoData(null);
            }
        } else if (jornadaId === null && partidoIndex === null) {
            // Si los IDs de ruta aún no se han descompuesto, esperamos
            setPartidoData(null);
        }
        
    }, [isAppLoading, jornadas, jornadaId, partidoIndex]); // Depende de las props y estados de ID


    // *************************************************************
    // FUNCIÓN DE CONEXIÓN AL BACKEND PARA GENERAR EL PLAN
    // *************************************************************
    const generarPlaneacion = async () => {
        if (!jornadaId || partidoIndex === null) {
            setError("Error: ID de la jornada o índice del partido no disponible.");
            return;
        }

        setIsGenerating(true);
        setError(null); 
        
        try {
            const url = `${API_BASE_URL}/api/generate-plan`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    jornadaId: jornadaId,
                    // Se envía el índice como string, como lo esperaba tu backend
                    partidoIndex: partidoIndex.toString() 
                }), 
            });

            const data = await response.json();

            if (!response.ok) {
                const details = data.details || data.error || 'Error desconocido';
                throw new Error(`Error en el servidor: ${details}`);
            }

            console.log("Planeación solicitada. Esperando actualización de Firestore...");
            // La actualización real vendrá de onSnapshot en el componente padre (App.tsx)
            setError(`Éxito: ${data.message}`);
            
        } catch (err) {
            console.error("Fallo de red o servidor:", err);
            setError(`No se pudo generar el plan. Detalles: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        } finally {
            setIsGenerating(false);
        }
    };


    // *************************************************************
    // RENDERIZADO CONDICIONAL DE CONTENIDO
    // *************************************************************

    // Muestra pantalla de carga si la data principal de Firestore no ha llegado
    if (isAppLoading) { 
        return <div className="p-8 text-center bg-gray-100 min-h-screen flex items-center justify-center">
            <PulseIcon className="text-emerald-500 w-10 h-10 animate-spin mr-3" />
            <span className="text-gray-600 font-medium">Cargando data principal de jornadas...</span>
        </div>;
    }

    // Muestra pantalla de error si no se encuentra el partido después de la carga
    if (!partidoData) {
         return <div className="p-8 text-center bg-red-50 min-h-screen flex flex-col items-center justify-center">
             <AlertCircleIcon className="text-red-500 w-12 h-12 mb-4" />
             <span className="text-red-600 font-bold">Error al cargar la información del partido.</span>
             <p className='text-sm text-gray-500 mt-2'>{error || "Partido no encontrado o ID inválido."}</p>
             <button 
                onClick={() => navigate(-1)} 
                className="mt-6 flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
            >
                <ArrowBackIcon className="mr-2 w-5 h-5" />
                Volver
            </button>
        </div>;
    }

    const currentPlan = partidoData.planeacion;


    const renderContent = () => {
        if (isGenerating) {
            // ... (Contenido de carga cuando se genera el plan)
            return (
                <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-lg">
                    <PulseIcon className="text-blue-500 w-12 h-12 animate-pulse" />
                    <p className="mt-4 text-gray-700 font-semibold">Generando plan táctico con IA...</p>
                    <p className="text-sm text-gray-500">Analizando estadísticas de la categoría: **{partidoData.categoria}**</p>
                </div>
            );
        }

        if (error && error.startsWith('No se pudo generar')) {
            // ... (Contenido de error de generación)
             return (
                <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-300 shadow-sm">
                    <AlertCircleIcon className="text-red-600 w-8 h-8" />
                    <p className="mt-2 text-red-700 font-medium">Error de Planeación:</p>
                    <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
            );
        }
        
        if (!currentPlan) {
            // ... (Contenido de plan no generado)
             return (
                <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg shadow-inner">
                    <h3 className="text-xl font-extrabold text-gray-700 mb-4">
                        ¡Plan Táctico No Generado!
                    </h3>
                    <div className="text-center text-gray-500 space-y-1">
                        <p>Categoría: <span className='font-semibold text-blue-600'>{partidoData.categoria}</span></p>
                        <p className='mt-4'>Presiona "GENERAR NUEVO PLAN" para analizar las estadísticas de **{partidoData.categoria}** y crear la planeación detallada.</p>
                    </div>
                </div>
            );
        }
        
        // RENDERIZADO DEL PLAN EXISTENTE
        return (
            <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100">

                {/* --- SECCIÓN: PREDICCIÓN Y ANÁLISIS --- */}
                {currentPlan.prediccion && (
                    <div className="mb-6 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                        <p className="font-semibold text-blue-700 flex items-center mb-1">
                            <PulseIcon className="mr-2 w-4 h-4" /> Análisis y Predicción:
                        </p>
                        <p className="text-sm text-blue-800">
                            <span className="font-bold">Resultado Predicho:</span> {currentPlan.prediccion.resultado}
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                            <span className="font-bold">Tendencias:</span> {currentPlan.prediccion.tendencias}
                        </p>
                    </div>
                )}
                {/* --- PLAN TÁCTICO DETALLADO --- */}
                <h3 className="text-xl font-extrabold text-blue-600 border-b pb-2 mb-4 flex items-center">
                    <BuildIcon className="mr-2 w-6 h-6" />
                    PLAN TÁCTICO DETALLADO
                </h3>

                {/* Objetivos */}
                <div className="mb-4">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center"><ListIcon className="mr-2 w-5 h-5 text-emerald-500" /> Objetivos de la Tripleta:</h4>
                    <ul className="list-inside text-gray-600 text-sm space-y-1">
                        {currentPlan.objetivos.map((obj, i) => (
                            <li key={i} className="flex items-start before:content-['•'] before:mr-2 before:text-emerald-500">
                                {obj}
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Observaciones de Equipos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t pt-4">
                    <div>
                        <h4 className="font-bold text-gray-700 mb-1 flex items-center"><PeopleIcon className="mr-2 w-5 h-5 text-red-500" /> {currentPlan.datos_equipo_local.nombre} (Local)</h4>
                        <p className="text-sm text-gray-600 italic">"{currentPlan.datos_equipo_local.observaciones}"</p>
                        <p className="text-xs text-gray-500 mt-1">Clave: {currentPlan.datos_equipo_local.jugadores_clave.join(', ')}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-700 mb-1 flex items-center"><PeopleIcon className="mr-2 w-5 h-5 text-blue-500" /> {currentPlan.datos_equipo_visitante.nombre} (Visitante)</h4>
                        <p className="text-sm text-gray-600 italic">"{currentPlan.datos_equipo_visitante.observaciones}"</p>
                        <p className="text-xs text-gray-500 mt-1">Clave: {currentPlan.datos_equipo_visitante.jugadores_clave.join(', ')}</p>
                    </div>
                </div>

                {/* Aspectos Clave y Reglas */}
                <div className="mt-6">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center"><BulbIcon className="mr-2 w-5 h-5 text-yellow-500" /> Puntos Críticos y Reglas:</h4>
                    <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                        {currentPlan.aspectos_clave_reglas.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>

                {/* Coordinación Arbitral */}
                <div className="mt-6 border-t pt-4">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center"><CodeIcon className="mr-2 w-5 h-5 text-purple-600" /> Coordinación y Códigos (Tripleta):</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p><span className="font-semibold">Código Faltas:</span> {currentPlan.coordinacion_arbitral.codigo_faltas}</p>
                        <p><span className="font-semibold">Código Cambios:</span> {currentPlan.coordinacion_arbitral.codigo_cambios}</p>
                        <p><span className="font-semibold">Minutos Críticos:</span> {currentPlan.coordinacion_arbitral.minutos_criticos}</p>
                    </div>
                </div>

            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4 bg-gray-50 min-h-screen">
            
            {/* Botón de Regreso y Título */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center text-emerald-600 font-semibold hover:text-emerald-800 transition mb-2 sm:mb-0"
                >
                    <ArrowBackIcon className="mr-2 w-6 h-6" />
                    Volver a Jornadas
                </button>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-800">
                        {partidoData.local} vs {partidoData.visitante}
                    </h2>
                    {/* ✅ CORRECCIÓN: Usamos 'fecha' y no 'dia' */}
                    <p className="text-sm text-gray-500">Cat: <span className="font-medium">{partidoData.categoria}</span> | {partidoData.fecha} {partidoData.hora}</p>
                    {/* ✅ CORRECCIÓN: Usamos 'arbitro_central' y no 'central' */}
                    <p className="text-xs text-gray-400">Central: {partidoData.arbitro_central}</p>
                </div>
            </div>
            
            {/* Meta-datos y Estado de la Planeación */}
            {currentPlan && (
                <div className="text-center bg-white p-2 rounded-lg shadow-sm border border-emerald-200">
                    <p className="text-xs text-gray-500">
                        <span className="font-medium">Plan Creado por:</span> {currentPlan.arbitro_creador} el {new Date(currentPlan.fecha_creacion).toLocaleDateString()}
                    </p>
                </div>
            )}
            
            {/* Mensajes de error/éxito */}
             {error && (
                <div className={`p-3 rounded-lg text-sm font-medium ${error.startsWith('Éxito') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {error}
                </div>
            )}
            
            {/* --- Sección de Contenido (Renderizado condicional) --- */}
            {renderContent()}

            {/* --- Botón de Acción Principal --- */}
            <button
                onClick={generarPlaneacion}
                disabled={isGenerating}
                className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition transform active:scale-95 ${
                    isGenerating 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
            >
                {isGenerating ? 'GENERANDO...' : (currentPlan ? 'RE-GENERAR PLAN CON IA' : 'GENERAR PLAN POR PRIMERA VEZ')}
            </button>
            
            <p className="text-xs text-gray-400 text-center mt-4">
                ID de Jornada: {jornadaId || 'N/A'} | Índice de Partido: {partidoIndex}
                {userId && <span className="ml-4">| User ID: {userId.substring(0, 8)}...</span>}
            </p>
            
        </div>
    );
};

export default PartidoDetail;
