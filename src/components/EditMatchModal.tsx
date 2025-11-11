import React, { useState, useEffect } from 'react';
import { doc, updateDoc, type Firestore } from 'firebase/firestore'; 
import type { Partido } from '../App'; 

// ====================================================================
// INTERFACES (Asegúrate de que Partido y Firestore estén importados)
// ====================================================================

interface EditMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    partido: Partido;
    jornadaId: string;
    partidoIndex: number;
    db: Firestore; // Asumimos que db nunca es null aquí
    setMainError: (error: string | null) => void;
    // 🎯 NUEVA PROP: Array completo de partidos
    todosLosPartidosDeLaJornada: Partido[]; 
}

const JORNADAS_COLLECTION = 'jornadas'; // Debe ser consistente con App.tsx

// ====================================================================
// COMPONENTE MODAL DE EDICIÓN
// ====================================================================

const EditMatchModal: React.FC<EditMatchModalProps> = ({ 
    isOpen, 
    onClose, 
    partido, 
    jornadaId, 
    partidoIndex, 
    db, 
    setMainError,
    // 🎯 DESESTRUCTURAR NUEVA PROP
    todosLosPartidosDeLaJornada 
}) => {
    
    // --- ESTADOS LOCALES ---
    const [newLocal, setNewLocal] = useState(partido.local);
    const [newVisitante, setNewVisitante] = useState(partido.visitante);
    const [newCategoria, setNewCategoria] = useState(partido.categoria);
    const [isSaving, setIsSaving] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Sincronizar estados cuando el partido cambie
    useEffect(() => {
        setNewLocal(partido.local);
        setNewVisitante(partido.visitante);
        setNewCategoria(partido.categoria);
        setLocalError(null);
    }, [partido]);


    // --- FUNCIÓN DE GUARDADO (Corregida para actualizar el array completo) ---
    const handleSave = async () => {
        if (isSaving) return;

        // Validación básica
        if (!newLocal || !newVisitante || !newCategoria) {
            setLocalError("Todos los campos son obligatorios.");
            return;
        }

        setIsSaving(true);
        setLocalError(null);
        setMainError(null); // Limpiar error del componente padre

        try {
            // Asegurarse de que el DB esté disponible
            if (!db) {
                throw new Error("Conexión a Firestore no disponible.");
            }
            
            const jornadaRef = doc(db, JORNADAS_COLLECTION, jornadaId);
            
            // 1. Crear una copia MUTABLE del array completo (¡CRUCIAL!)
            // Esto nos permite modificar un elemento sin mutar el estado de React directamente.
            const newPartidosArray = [...todosLosPartidosDeLaJornada];

            // 2. Crear el objeto de datos actualizados para el partido
            const updatedMatchData: Partial<Partido> = {
                local: newLocal,
                visitante: newVisitante,
                categoria: newCategoria,
            };

            // 3. Aplicar los cambios al partido específico en la copia
            // Se usa el spread para mantener cualquier campo existente (como planeacion)
            newPartidosArray[partidoIndex] = {
                ...newPartidosArray[partidoIndex], 
                ...updatedMatchData,
            };
            
            // 4. ¡Actualizar el campo 'partidos' con el array COMPLETO y CORREGIDO!
            // Esto sobrescribe el array anterior, solucionando el problema del índice
            // que convertía el array en un objeto con { "partidos": { "0": { ... } } }
            const updateObject = {
                partidos: newPartidosArray,
            };
            
            await updateDoc(jornadaRef, updateObject);

            setMainError(`Éxito: Partido actualizado (${newLocal} vs ${newVisitante}).`);
            onClose();

        } catch (error) {
            console.error("Error al guardar el partido:", error);
            const errorMessage = `Fallo al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`;
            setLocalError(errorMessage);
            setMainError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };


    // --- RENDERIZADO DEL MODAL ---
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 scale-100">
                
                <h3 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">
                    Editar Partido <span className='text-emerald-600'>({jornadaId}-{partidoIndex + 1})</span>
                </h3>

                <p className="text-sm text-gray-500 mb-4">
                    Edita el equipo local, el visitante o la categoría. Esto solo actualiza la base de datos para la aplicación.
                </p>

                <div className="space-y-4">
                    {/* Campo Local */}
                    <div>
                        <label htmlFor="local" className="block text-sm font-medium text-gray-700">Equipo Local</label>
                        <input
                            id="local"
                            type="text"
                            value={newLocal}
                            onChange={(e) => setNewLocal(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Campo Visitante */}
                    <div>
                        <label htmlFor="visitante" className="block text-sm font-medium text-gray-700">Equipo Visitante</label>
                        <input
                            id="visitante"
                            type="text"
                            value={newVisitante}
                            onChange={(e) => setNewVisitante(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Campo Categoría */}
                    <div>
                        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoría</label>
                        <input
                            id="categoria"
                            type="text"
                            value={newCategoria}
                            onChange={(e) => setNewCategoria(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {localError && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                            {localError}
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        type="button"
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition transform ${isSaving
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                        }`}
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