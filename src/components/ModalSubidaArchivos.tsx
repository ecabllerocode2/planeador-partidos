import React, { useState } from 'react';
import { IoClose, IoImage, IoCloudUpload, IoCheckmarkCircle, IoWarning } from 'react-icons/io5';

interface ModalSubidaProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackendResponse {
    message?: string;
    docId?: string;
    error?: string;
    details?: string;
}

const ModalSubidaArchivos: React.FC<ModalSubidaProps> = ({ isOpen, onClose }) => {
  const [imagenAsignacion, setImagenAsignacion] = useState<File | null>(null);
  const [jornadaIdInput, setJornadaIdInput] = useState(''); // Nuevo estado para la jornada
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
    setUploadStatus('idle');
  };
  
  const handleJornadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Forzamos el formato a "Jornada X"
      const value = e.target.value.trim();
      const match = value.match(/(\d+)/); // Busca el primer número
      
      if (match) {
          setJornadaIdInput(`Jornada ${match[0]}`);
      } else if (value.length === 0) {
          setJornadaIdInput('');
      } else {
          // Permite escribir, pero prefiere el formato
          setJornadaIdInput(value);
      }
      setUploadStatus('idle');
  };


  const handleUpload = async () => {
    if (!imagenAsignacion || !jornadaIdInput) { // Validamos también el nuevo campo
      alert("Por favor, sube la imagen de asignación e ingresa la Jornada.");
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('scheduleImage', imagenAsignacion);
    // 🚨 IMPORTANTE: Enviamos la jornada como texto, aunque el backend extract-schedule no la use para la extracción, la guardaremos como un campo adicional.
    formData.append('jornadaId', jornadaIdInput); 


    const ENDPOINT_URL = 'https://planeador-partidos-backend.vercel.app/api/extract-schedule';

    try {
        const response = await fetch(ENDPOINT_URL, {
            method: 'POST',
            body: formData, 
        });

        let data: BackendResponse = {}; 
        
        try {
            data = await response.json(); 
        } catch (e) {
            console.warn("⚠️ Fallo en response.json(). Probable contaminación del backend.");
        }

        if (!response.ok) {
            const errorMsg = data.error || data.details || 'Fallo desconocido al contactar al backend.';
            setUploadStatus('error');
            alert(`❌ Error en el procesamiento: ${errorMsg}`);
            return;
        }

        // ÉXITO (Status 200 OK)
        setUploadStatus('success');
        
        const docId = data.docId || jornadaIdInput; // Usamos la jornada como ID si no hay docId (es el patrón que usa tu backend)
        const successMsg = `🎉 ¡Jornada procesada con éxito! Documento guardado con ID: ${docId}.`;
        
        // Resetear inputs tras éxito (opcional)
        setImagenAsignacion(null);
        // setJornadaIdInput(''); // Dejar el campo para subir la siguiente jornada o cerrar

        alert(successMsg); 

    } catch (error) {
        console.error('Error de conexión o red fatal:', error);
        setUploadStatus('error');
        alert("🚨 Error de conexión. Revisa el estado de tu red. (El servidor no fue alcanzado).");
    } finally {
        setIsUploading(false);
    }
  };


  const buttonDisabled = !imagenAsignacion || !jornadaIdInput || isUploading; 

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <IoCloudUpload className="mr-2 text-blue-500" />
            Cargar Asignación de Jornada
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IoClose className="text-2xl" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          
          {/* Campo de Jornada (NUEVO) */}
          <div className="space-y-2 border-l-4 border-blue-500 p-2 bg-blue-50 rounded">
            <label className="block text-sm font-bold text-gray-800 flex items-center">
              <IoWarning className="mr-1 text-blue-500" />
              1. Identificador de Jornada (Ej: "Jornada 7")
            </label>
            <input
              type="text"
              placeholder="Ej. Jornada 7, Jornada 15"
              value={jornadaIdInput}
              onChange={handleJornadaChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
            {jornadaIdInput && <p className="text-xs text-gray-600 mt-1">ID a usar: **{jornadaIdInput}**</p>}
          </div>

          {/* Campo de Imagen de Asignación */}
          <div className="space-y-2 border-l-4 border-emerald-500 p-2 bg-emerald-50 rounded">
            <label className="block text-sm font-bold text-gray-800 flex items-center">
              <IoImage className="mr-1 text-emerald-500" />
              2. Imagen de Asignación (Horario) - Requerido
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setImagenAsignacion)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-200 file:text-emerald-800 hover:file:bg-emerald-300"
              required
            />
            {imagenAsignacion && <p className="text-xs text-gray-600 mt-1">Archivo cargado: **{imagenAsignacion.name}**</p>}
          </div>

          {/* Se eliminó el campo de PDF de Sanciones. */}
          
          {uploadStatus === 'success' && (
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded flex items-center font-semibold">
                  <IoCheckmarkCircle className="mr-2 text-xl" /> ¡Archivos subidos y datos guardados!
              </div>
          )}
          {uploadStatus === 'error' && (
              <div className="p-2 bg-red-100 text-red-700 rounded flex items-center font-semibold">
                  <IoClose className="mr-2 text-xl" /> Error al procesar los archivos.
              </div>
          )}

        </div>
        
        <div className="p-4 border-t">
          <button
            onClick={handleUpload}
            disabled={buttonDisabled}
            className={`w-full py-3 font-bold rounded-lg shadow-md transition ${
              buttonDisabled
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <IoCloudUpload className="animate-pulse mr-2" /> 
                Subiendo y Procesando...
              </span>
            ) : (
              "PROCESAR DOCUMENTOS"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSubidaArchivos;