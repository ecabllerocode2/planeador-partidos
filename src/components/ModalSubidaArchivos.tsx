import React, { useState } from 'react';
import { IoClose, IoImage, IoDocumentText, IoCloudUpload, IoCheckmarkCircle, IoWarning } from 'react-icons/io5';

interface ModalSubidaProps {
  isOpen: boolean;
  onClose: () => void;
}

// Interfaz para la respuesta esperada (incluye error para el tipado)
interface BackendResponse {
    message?: string;
    docId?: string;
    error?: string;
    details?: string;
    totalPartidos?: number;
    totalSanciones?: number;
}

const ModalSubidaArchivos: React.FC<ModalSubidaProps> = ({ isOpen, onClose }) => {
  const [imagenAsignacion, setImagenAsignacion] = useState<File | null>(null);
  const [pdfSanciones, setPdfSanciones] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
    setUploadStatus('idle');
  };

  const handleUpload = async () => {
    if (!imagenAsignacion) {
      alert("Por favor, sube la imagen de asignación (horario).");
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('scheduleImage', imagenAsignacion);
    if (pdfSanciones) {
        formData.append('sanctionsPdf', pdfSanciones);
    }

    const ENDPOINT_URL = 'https://planeador-partidos-backend.vercel.app/api/extract-schedule';

    try {
        const response = await fetch(ENDPOINT_URL, {
            method: 'POST',
            body: formData, 
        });

        // 1. Manejo de la respuesta HTTP
        let data: BackendResponse = {}; // Inicializamos con la interfaz
        
        try {
            // Intentamos parsear SIEMPRE, incluso si el status no es OK, para obtener el cuerpo del error
            data = await response.json(); 
        } catch (e) {
            // Si el parseo falla (p. ej., backend contamina la respuesta), no lanzamos error AÚN
            console.warn("⚠️ Fallo en response.json(). Probable contaminación del backend.");
        }

        // 2. Si el status NO es OK, es un error real del servidor (4xx/5xx)
        if (!response.ok) {
            const errorMsg = data.error || data.details || 'Fallo desconocido al contactar al backend.';
            console.error('Error del backend:', errorMsg);
            setUploadStatus('error');
            alert(`❌ Error en el procesamiento: ${errorMsg}`);
            return;
        }

        // 3. ÉXITO (Status 200 OK)
        setUploadStatus('success');
        
        const docId = data.docId || 'N/A';
        let successMsg = `🎉 ¡Jornada procesada con éxito! Documento guardado con ID: ${docId}.`;

        // Si falló el parseo pero el status fue 200, ¡forzamos el éxito y explicamos el aviso!
        if (!data.docId && response.status === 200) {
             successMsg = `🎉 ¡Jornada procesada! (Problema de comunicación: el backend dijo OK, pero el JSON estaba dañado. Los datos están en Firestore).`;
        }
        
        console.log("Respuesta Exitosa:", data);
        alert(successMsg); // Alerta bonita de éxito

    } catch (error) {
        // 4. MANEJO DE ERROR DE RED FATAL (Aquí solo llegan fallos de red, como DNS o CORS)
        console.error('Error de conexión o red fatal:', error);
        setUploadStatus('error');
        alert("🚨 Error de conexión. Revisa el estado de tu red. (El servidor no fue alcanzado).");
    } finally {
        setIsUploading(false);
    }
  };

  // ... (El resto del JSX se mantiene igual)

  const buttonDisabled = !imagenAsignacion || isUploading; 

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        
        {/* Header del Modal */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <IoCloudUpload className="mr-2 text-blue-500" />
            Cargar Documentos de Jornada
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IoClose className="text-2xl" />
          </button>
        </div>
        
        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-5">
          
          {/* Campo de Imagen de Asignación (REQUERIDO) */}
          <div className="space-y-2 border-l-4 border-emerald-500 p-2 bg-emerald-50 rounded">
            <label className="block text-sm font-bold text-gray-800 flex items-center">
              <IoImage className="mr-1 text-emerald-500" />
              1. Imagen de Asignación (Horario) - Requerido
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setImagenAsignacion)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-200 file:text-emerald-800 hover:file:bg-emerald-300"
            />
            {imagenAsignacion && <p className="text-xs text-gray-600 mt-1">Archivo cargado: **{imagenAsignacion.name}**</p>}
          </div>

          {/* Campo de PDF de Sanciones (OPCIONAL) */}
          <div className="space-y-2 border-l-4 border-red-500 p-2 bg-red-50 rounded">
            <label className="block text-sm font-medium text-gray-800 flex items-center">
              <IoDocumentText className="mr-1 text-red-500" />
              2. Documento PDF (Sanciones) - Opcional
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e, setPdfSanciones)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-200 file:text-red-800 hover:file:bg-red-300"
            />
            {pdfSanciones && <p className="text-xs text-gray-600 mt-1">Archivo cargado: **{pdfSanciones.name}**</p>}
          </div>
          
          {/* Mostrar estado de la subida */}
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
        
        {/* Footer y Botón de Acción */}
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