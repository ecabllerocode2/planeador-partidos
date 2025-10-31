// src/components/JornadaCard.tsx

import React, { useState } from 'react';
import { IoChevronDown, IoChevronUp, IoFootball, IoLocationSharp, IoTime } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

// Definición de tipos basada en la estructura del JSON simulado
interface Partido {
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

interface JornadaData {
    id: string;
    fechaCreacion: string;
    parsedData: {
        jornada: string;
        partidos: Partido[];
    };
}

// Interfaz para el componente (usaremos un solo prop para la data)
interface JornadaCardProps {
    jornada: JornadaData;
}

// --- Componente interno para cada partido (Atomic Design) ---
const PartidoDetail: React.FC<{ partido: Partido, partidoId: string }> = ({ partido, partidoId }) => {

    const navigate = useNavigate(); // 👈 Inicializamos el hook

    // Función de navegación que será llamada al hacer click
    const handleClick = () => {
        // Navegamos a la ruta de detalle con un ID único. 
        // Usamos una combinación de la sede, categoría y hora como ID temporal
        navigate(`/partido/${partidoId}`);
    };

    const esMiPartido = (nombre: string) => nombre === "EDGAR";

    return (
        <button
            onClick={handleClick} className="border-t border-gray-100 py-3 px-4 bg-white/50 hover:bg-white transition duration-150">
            <div className="flex justify-between items-start text-sm">
                <p className="font-medium text-gray-800 flex items-center">
                    <IoFootball className="text-emerald-500 mr-2 text-base" />
                    {partido.local} vs {partido.visitante}
                </p>
                <p className="text-xs font-semibold text-blue-600 bg-blue-100 rounded-full px-2 py-0.5 ml-2">
                    {partido.categoria}
                </p>
            </div>

            <div className="mt-2 text-xs text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                    <p className="flex items-center">
                        <IoTime className="mr-1 text-xs" />
                        {partido.dia}, {partido.hora}
                    </p>
                    <p className="flex items-center">
                        <IoLocationSharp className="mr-1 text-xs" />
                        {partido.sede}
                    </p>
                </div>

                {/* Visualización de la cuarteta arbitral */}
                <p className="text-xs pt-1 border-t border-dashed border-gray-100 mt-1">
                    <span className="font-medium">Central: </span>
                    <span className={esMiPartido(partido.central) ? "font-bold text-red-600" : "font-semibold text-gray-700"}>
                        {partido.central}
                    </span>
                    <span className="ml-3 font-medium">Asistentes: </span>
                    {partido.asistente1}, {partido.asistente2}
                </p>
            </div>
        </button>
    );
};
// --- Fin Componente PartidoDetail ---

const JornadaCard: React.FC<JornadaCardProps> = ({ jornada }) => {
    // Estado para controlar el acordeón (abierto/cerrado)
    const [isOpen, setIsOpen] = useState(false);

    // Función para manejar el toggle del acordeón
    const handleToggle = () => setIsOpen(!isOpen);

    const { jornada: numJornada, partidos } = jornada.parsedData;

    // Formateo simple de fecha para mejor lectura
    const fecha = new Date(jornada.fechaCreacion).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
            {/* Cabecera de la Tarjeta (Clickable para abrir/cerrar) */}
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                aria-expanded={isOpen}
                aria-controls={`content-${jornada.id}`}
            >
                {/* Información Principal de la Jornada */}
                <div>
                    <h3 className="text-xl font-extrabold text-gray-800">
                        JORNADA {numJornada}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {partidos.length} Partidos Asignados
                    </p>
                </div>

                {/* Meta data y Toggle Icon */}
                <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400 hidden sm:block">
                        Creada: {fecha}
                    </span>
                    <div className="text-2xl text-emerald-500">
                        {isOpen ? <IoChevronUp /> : <IoChevronDown />}
                    </div>
                </div>
            </button>

            {/* Contenido del Acordeón (Lista de Partidos) */}
            <div
                id={`content-${jornada.id}`}
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
                style={{ overflow: 'hidden' }} // Asegura que se oculte correctamente
            >
                <div className="border-t border-gray-200">
                    {partidos.map((partido, index) => {
                        // Generamos un ID único para la ruta (e.g., "1761172079486_Jornada5-0")
                        const partidoId = `${jornada.id}-${index}`;

                        return (
                            <PartidoDetail
                                key={index}
                                partido={partido}
                                partidoId={partidoId}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default JornadaCard;