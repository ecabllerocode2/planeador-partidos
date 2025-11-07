import React, { useState } from 'react';
// 🔑 Importaciones CLAVE de Firestore para la lógica de guardado
import { Firestore, collection, doc, updateDoc } from 'firebase/firestore'; 
import type { Partido } from '../App';

// Ícono de Cerrar
const XIcon = (props: any) => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

interface EditMatchModalProps {
    isOpen: boolean; 
    onClose: () => void;
    partido: Partido;
    jornadaId: string;
    partidoIndex: number;
    db: Firestore | null;
    setMainError: (error: string | null) => void;
}

const JORNADAS_COLLECTION = 'jornadas';

const EditMatchModal: React.FC<EditMatchModalProps> = ({ 
    isOpen, 
    onClose, 
    partido, 
    jornadaId, 
    partidoIndex, 
    db, 
    setMainError, 
}) => {

    // 🛑 Implementación CLAVE: Si no está abierto, no renderiza el modal.
    if (!isOpen) {
        return null;
    }

    const [newLocal, setNewLocal] = useState(partido.local);
    const [newVisitante, setNewVisitante] = useState(partido.visitante);
    const [newCategoria, setNewCategoria] = useState(partido.categoria);
    const [isSaving, setIsSaving] = useState(false);

    // *************************************************************
    // FUNCIÓN CLAVE: Guardar Cambios en Firestore
    // *************************************************************
    const handleSave = async () => {
        if (!db) {
            setMainError("Error: Conexión a la base de datos no disponible.");
            onClose();
            return;
        }

        setIsSaving(true);
        setMainError(null);

        const updatedMatchData: Partial<Partido> = {
            local: newLocal,
            visitante: newVisitante,
            categoria: newCategoria,
        };
        
        // 🔑 NOTA: La ruta de la subcolección `partidos` dentro del documento `jornadaId`
        // es implícitamente `partidos[partidoIndex]`. Firestore no permite actualizar 
        // elementos de un array directamente sin saber el índice, por lo que debes
        // actualizar el campo completo del array en el documento de la jornada.

        // Path: collection('jornadas') -> doc(jornadaId)
        const jornadaRef = doc(collection(db, JORNADAS_COLLECTION), jornadaId);

        try {
            // 1. Obtener la data actual (idealmente solo los partidos, si fuera necesario)
            // Ya que solo actualizamos los datos, procederemos directamente.
            
            // 2. Crear el path de actualización del campo específico del array:
            const arrayUpdatePath = `partidos.${partidoIndex}`;
            
            // 3. Crear el objeto de actualización: { "partidos.<index>": updatedMatchData }
            const updateObject = {
                [arrayUpdatePath]: {
                    ...partido, // Mantenemos el resto de los campos (hora, campo, etc.)
                    ...updatedMatchData, // Sobrescribimos los campos editados
                },
            };
            
            await updateDoc(jornadaRef, updateObject);

            setMainError(`Éxito: Partido ${jornadaId}-${partidoIndex} actualizado.`);
            onClose();

        } catch (error) {
            console.error("Error al guardar cambios en Firestore:", error);
            setMainError(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        // Contenedor principal: Fijo, ocupa toda la pantalla y tiene fondo oscuro.
        <div 
            className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            {/* Contenedor del contenido: Ventana blanca y centrada. */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">
                        Editar Partido
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        aria-label="Cerrar modal"
                    >
                        <XIcon />
                    </button>
                </div>
                
                {/* FORMULARIO DE EDICIÓN */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Equipo Local</label>
                        <input
                            type="text"
                            value={newLocal}
                            onChange={(e) => setNewLocal(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Equipo Visitante</label>
                        <input
                            type="text"
                            value={newVisitante}
                            onChange={(e) => setNewVisitante(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Categoría</label>
                        <input
                            type="text"
                            value={newCategoria}
                            onChange={(e) => setNewCategoria(e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            disabled={isSaving}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        disabled={isSaving}
                    >
                        Cancela
                    </button>
                    <button
                        onClick={handleSave} 
                        className={`py-2 px-4 text-white rounded-lg transition ${isSaving ? 'bg-blue-300 cursor-wait' : 'bg-blue-500 hover:bg-blue-600'}`}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditMatchModal;