import React, { useState } from 'react';
import { IoChevronDown, IoChevronUp, IoFootball, IoLocationSharp, IoTime } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
// FIX: Usamos 'import type' para resolver el error TS1484
import type { Partido, JornadaData } from '../App';


// Interfaz para el componente (usaremos un solo prop para la data)
interface JornadaCardProps {
    jornada: JornadaData;
}

// --- Componente interno para cada partido (Atomic Design) ---
const PartidoDetail: React.FC<{ partido: Partido, partidoId: string }> = ({ partido, partidoId }) => {

    const navigate = useNavigate();

    // La función de navegación usa el ID construido en el padre
    const handleClick = () => {
        navigate(`/partido/${partidoId}`);
    };

    const esMiPartido = (nombre: string) => nombre === "EDGAR"; // Usar el nombre de usuario autenticado aquí

    // 🛑 CORRECCIONES APLICADAS
    const arbitroCentral = partido.arbitro_central || 'Por definir';
    const arbitroLinea1 = partido.arbitro_linea_1 || 'N/A';
    const arbitroLinea2 = partido.arbitro_linea_2 || 'N/A';
    const sedePartido = partido.campo || 'Sede no especificada';

    return (
        <button
            onClick={handleClick} 
            className="w-full text-left border-t border-gray-100 py-3 px-4 bg-white/50 hover:bg-white transition duration-150"
        >
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
                        {partido.fecha}, {partido.hora} {/* Usando 'fecha' y 'hora' */}
                    </p>
                    <p className="flex items-center">
                        <IoLocationSharp className="mr-1 text-xs" />
                        {sedePartido} {/* ✅ Usando 'campo' */}
                    </p>
                </div>

                {/* Visualización de la cuarteta arbitral */}
                <p className="text-xs pt-1 border-t border-dashed border-gray-100 mt-1">
                    <span className="font-medium">Central: </span>
                    <span className={esMiPartido(arbitroCentral) ? "font-bold text-red-600" : "font-semibold text-gray-700"}>
                        {arbitroCentral} {/* ✅ Usando 'arbitro_central' */}
                    </span>
                    <span className="ml-3 font-medium">Asistentes: </span>
                    {/* ✅ Usando 'arbitro_linea_1' y 'arbitro_linea_2' */}
                    {arbitroLinea1} {arbitroLinea1 !== 'N/A' && arbitroLinea2 !== 'N/A' ? ',' : ''} {arbitroLinea2}
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

    // 🛑 CORRECCIÓN APLICADA: Usamos 'jornadaId' que es la clave correcta de Firestore
    const { jornadaId, partidos } = jornada; 

    // ✅ CORRECCIÓN CLAVE: Formateo de fecha robusto que maneja Timestamps de Firebase y strings inválidos.
    const fecha = (() => {
        const rawDate = jornada.fechaExtraccion;
        let dateObj: Date | null = null;
        
        if (rawDate) {
            // 1. Manejar el objeto Firestore Timestamp (si viene sin convertir)
            // Esto verifica si tiene la estructura típica de un Timestamp: { seconds, nanoseconds, toDate }
            if (typeof rawDate === 'object' && rawDate !== null && 'seconds' in rawDate && typeof (rawDate as any).toDate === 'function') {
                dateObj = (rawDate as any).toDate();
            } 
            // 2. Intentar manejarlo como string o Date
            else {
                const tempDate = new Date(rawDate);
                if (!isNaN(tempDate.getTime())) {
                    dateObj = tempDate;
                }
            }
        }

        if (dateObj) {
            // Si es válido, formateamos
            return dateObj.toLocaleDateString('es-MX', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        }

        // 3. Si no es válido (null, undefined, string inválido, o Timestamp malformado)
        return 'Fecha no disponible';
    })();
    // FIN CORRECCIÓN CLAVE

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
                        {jornadaId} {/* ✅ Usando 'jornadaId' */}
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
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}
                style={{ overflow: 'hidden' }} // Asegura que se oculte correctamente
            >
                <div className="border-t border-gray-200">
                    {partidos.map((partido, index) => {
                        // Generamos un ID único para la ruta (e.g., "J01-0", "J01-1")
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