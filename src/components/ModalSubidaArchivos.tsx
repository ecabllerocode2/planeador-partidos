import React, { useState } from 'react';
import { IoClose, IoImage, IoCloudUpload, IoCheckmarkCircle, IoWarning, IoDocumentText } from 'react-icons/io5';

interface ModalSubidaProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackendResponse {
  message?: string;
  docId?: string;
  error?: string;
  details?: string;
  totalPartidos?: number;
  totalSanciones?: number;
}

const ModalSubidaArchivos: React.FC<ModalSubidaProps> = ({ isOpen, onClose }) => {
  // Estado para la imagen obligatoria
  const [imagenAsignacion, setImagenAsignacion] = useState<File | null>(null);
  
  // ✅ Estado para MULTIPLES ARCHIVOS de sanciones
  const [imagenesSanciones, setImagenesSanciones] = useState<File[]>([]); 
  
  const [jornadaIdInput, setJornadaIdInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  // =================================================================
  // ✅ Manejadores de Archivos ESPECÍFICOS para evitar errores TS2345
  // =================================================================
  
  // 1. Manejador para UN solo archivo (Imagen de Asignación)
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImagenAsignacion(e.target.files[0]);
    } else {
      setImagenAsignacion(null);
    }
    setUploadStatus('idle');
  };

  // 2. Manejador para MÚLTIPLES archivos (Imágenes de Sanciones)
  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImagenesSanciones(Array.from(e.target.files));
    } else {
      setImagenesSanciones([]);
    }
    setUploadStatus('idle');
  };


  // Manejador de Jornada (sin cambios)
  const handleJornadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    const match = value.match(/(\d+)/);

    if (match) {
      setJornadaIdInput(`Jornada ${match[0]}`);
    } else if (value.length === 0) {
      setJornadaIdInput('');
    } else {
      setJornadaIdInput(value);
    }
    setUploadStatus('idle');
  };


  const handleUpload = async () => {
    if (!imagenAsignacion || !jornadaIdInput) {
      alert("Por favor, sube la imagen de asignación e ingresa la Jornada.");
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('scheduleImage', imagenAsignacion);
    formData.append('jornadaId', jornadaIdInput);

    // ✅ Iteramos sobre el array de imágenes y adjuntamos cada una
    if (imagenesSanciones.length > 0) {
        imagenesSanciones.forEach((file) => {
            // Usamos la misma clave 'sanctionsPdf' para todos los archivos.
            formData.append('sanctionsPdf', file, file.name); 
        });
    }

    // Asegúrate de que esta URL sea la correcta para tu endpoint de Vercel.
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

      const docId = data.docId || jornadaIdInput;
      const totalP = data.totalPartidos || 0;
      const totalS = data.totalSanciones || 0;

      const successMsg = `🎉 ¡Jornada procesada con éxito! Documento guardado con ID: ${docId}.\nPartidos extraídos: ${totalP}\nSanciones extraídas: ${totalS}`;

      // Resetear inputs tras éxito
      setImagenAsignacion(null);
      setImagenesSanciones([]); // ✅ Resetear el array de imágenes de sanciones
      
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

          {/* Campo de Jornada (sin cambios) */}
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

          {/* Campo de Imagen de Asignación (usa handleSingleFileChange) */}
          <div className="space-y-2 border-l-4 border-emerald-500 p-2 bg-emerald-50 rounded">
            <label className="block text-sm font-bold text-gray-800 flex items-center">
              <IoImage className="mr-1 text-emerald-500" />
              2. Imagen de Asignación (Horario) - Requerido
            </label>
            <input
              type="file"
              accept="image/*"
              // ✅ Usar el manejador de archivo único
              onChange={handleSingleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-200 file:text-emerald-800 hover:file:bg-emerald-300"
              required
            />
            {imagenAsignacion && <p className="text-xs text-gray-600 mt-1">Archivo cargado: **{imagenAsignacion.name}**</p>}
          </div>

          {/* ✅ Campo de Captura de Sanciones (MÚLTIPLE, usa handleMultipleFilesChange) */}
          <div className="space-y-2 border-l-4 border-amber-500 p-2 bg-amber-50 rounded">
            <label className="block text-sm font-bold text-gray-800 flex items-center">
              <IoDocumentText className="mr-1 text-amber-500" />
              3. Captura(s) de Sanciones (JPG/PNG) - Opcional
            </label>
            <input
              type="file"
              // ✅ SOLO ACEPTA FORMATOS DE IMAGEN
              accept="image/jpeg, image/png, image/webp"
              // ✅ Habilitar múltiples archivos
              multiple 
              // ✅ Usar el manejador de archivos múltiples
              onChange={handleMultipleFilesChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-200 file:text-amber-800 hover:file:bg-amber-300"
            />
            {/* ✅ Mostrar el número de archivos cargados */}
            {imagenesSanciones.length > 0 && <p className="text-xs text-gray-600 mt-1">Archivos cargados: **{imagenesSanciones.length} imágenes**</p>}
          </div>


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
            className={`w-full py-3 font-bold rounded-lg shadow-md transition ${buttonDisabled
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