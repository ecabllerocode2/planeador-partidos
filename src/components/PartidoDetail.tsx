// src/components/PartidoDetail.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import planeacionData from '../data/planeacionFicticia.json'; 
import { IoArrowBack, IoBuild, IoList, IoPeople, IoBulb, IoCodeWorking } from 'react-icons/io5'; // Agregué un ícono para el código arbitral


// ------------------------------------------------------------------------
// INTERFAZ COMPLETA DE PLANEACIÓN
// ------------------------------------------------------------------------
interface Planeacion {
    id_planeacion: string;
    arbitro_creador: string;
    fecha_creacion: string;
    partido_referencia: string;
    objetivos: string[];
    datos_equipo_local: { 
        nombre: string; 
        observaciones: string; 
        jugadores_clave: string[] 
    };
    datos_equipo_visitante: { 
        nombre: string; 
        observaciones: string; 
        jugadores_clave: string[] 
    };
    aspectos_clave_reglas: string[];
    coordinacion_arbitral: {
        codigo_faltas: string;
        codigo_cambios: string;
        minutos_criticos: string;
    };
}
// ------------------------------------------------------------------------


const PartidoDetail: React.FC = () => {
    const { partidoId } = useParams<{ partidoId: string }>(); 
    const navigate = useNavigate();
    
    // Aquí usamos el casting para indicar a TypeScript que la data cumple con la interfaz
    const plan: Planeacion = planeacionData as Planeacion;

    if (!partidoId) {
        return <div className="p-4 text-center text-red-500">Error: Partido no especificado.</div>;
    }

    return (
        <div className="space-y-6">
            
            {/* Botón de Regreso y Título */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center text-emerald-600 font-semibold hover:text-emerald-800 transition"
                >
                    <IoArrowBack className="mr-2 text-xl" />
                    Volver a Jornadas
                </button>
                <h2 className="text-xl font-bold text-gray-800">
                    {plan.partido_referencia}
                </h2>
            </div>
            
            {/* Meta-datos y Fechas */}
            <div className="text-center bg-white/70 p-2 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">
                    <span className="font-medium">Plan Creado por:</span> {plan.arbitro_creador} el {plan.fecha_creacion}
                </p>
            </div>
            

            {/* --- Sección de Planeación --- */}
            <div className="bg-white p-5 rounded-lg shadow-lg">
                <h3 className="text-xl font-extrabold text-blue-600 border-b pb-2 mb-4 flex items-center">
                    <IoBuild className="mr-2" />
                    PLAN TÁCTICO DEL PARTIDO
                </h3>

                {/* Objetivos */}
                <div className="mb-4">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center"><IoList className="mr-2 text-emerald-500" /> Objetivos de la Cuarteta:</h4>
                    <ul className="list-inside text-gray-600 text-sm space-y-1">
                        {plan.objetivos.map((obj, i) => (
                            <li key={i} className="flex items-start before:content-['•'] before:mr-2 before:text-emerald-500">
                                {obj}
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Observaciones de Equipos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t pt-4">
                    <div>
                        <h4 className="font-bold text-gray-700 mb-1 flex items-center"><IoPeople className="mr-2 text-red-500" /> {plan.datos_equipo_local.nombre} (Local)</h4>
                        <p className="text-sm text-gray-600 italic">"{plan.datos_equipo_local.observaciones}"</p>
                        <p className="text-xs text-gray-500 mt-1">Clave: {plan.datos_equipo_local.jugadores_clave.join(', ')}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-700 mb-1 flex items-center"><IoPeople className="mr-2 text-blue-500" /> {plan.datos_equipo_visitante.nombre} (Visitante)</h4>
                        <p className="text-sm text-gray-600 italic">"{plan.datos_equipo_visitante.observaciones}"</p>
                        <p className="text-xs text-gray-500 mt-1">Clave: {plan.datos_equipo_visitante.jugadores_clave.join(', ')}</p>
                    </div>
                </div>

                {/* Aspectos Clave y Reglas */}
                <div className="mt-6">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center"><IoBulb className="mr-2 text-yellow-500" /> Puntos Críticos y Reglas:</h4>
                    <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                        {plan.aspectos_clave_reglas.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>

                {/* Coordinación Arbitral */}
                <div className="mt-6 border-t pt-4">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center"><IoCodeWorking className="mr-2 text-purple-600" /> Coordinación y Códigos (Cuarteta):</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p><span className="font-semibold">Código Faltas:</span> {plan.coordinacion_arbitral.codigo_faltas}</p>
                        <p><span className="font-semibold">Código Cambios:</span> {plan.coordinacion_arbitral.codigo_cambios}</p>
                        <p><span className="font-semibold">Minutos Críticos:</span> {plan.coordinacion_arbitral.minutos_criticos}</p>
                    </div>
                </div>

            </div>

            {/* --- Botón de Acción Principal --- */}
            <button
                className="w-full py-3 bg-emerald-500 text-white font-bold rounded-lg shadow-md hover:bg-emerald-600 transition"
            >
                GENERAR NUEVO PLAN
            </button>
            
        </div>
    );
};

export default PartidoDetail;