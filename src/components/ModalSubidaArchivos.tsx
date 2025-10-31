// src/components/ModalSubidaArchivos.tsx

import React, { useState } from 'react';
import { IoClose, IoImage, IoDocumentText, IoCloudUpload, IoCheckmarkCircle } from 'react-icons/io5';

interface ModalSubidaProps {
  isOpen: boolean;
  onClose: () => void;
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
  };

  const handleUpload = async () => {
    if (!imagenAsignacion || !pdfSanciones) {
      alert("Por favor, sube tanto la imagen de asignación como el PDF de sanciones.");
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    // 1. Crear el objeto FormData
    const formData = new FormData();
    // CAMBIO CLAVE: Los nombres de campo deben coincidir con los del backend (scheduleImage, sanctionsPdf)
    formData.append('scheduleImage', imagenAsignacion);
    formData.append('sanctionsPdf', pdfSanciones);

    // 2. Definir la URL del Endpoint (usar la URL de Vercel cuando esté desplegado)
    // Usamos el endpoint local de desarrollo por ahora:
    const ENDPOINT_URL = 'http://localhost:3000/api/extract-schedule'; 
    // const ENDPOINT_URL = 'https://[TU_VERCEL_URL].vercel.app/api/extract-schedule'; // <- Desplegado

    try {
        // 3. Realizar la Petición
        const response = await fetch(ENDPOINT_URL, {
            method: 'POST',
            body: formData, // fetch maneja automáticamente el Content-Type: multipart/form-data
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error del backend:', data.details || data.error);
            setUploadStatus('error');
            alert(`Error en el procesamiento: ${data.error || 'Fallo desconocido.'}`);
            return;
        }

        // 4. Éxito
        setUploadStatus('success');
        console.log("Respuesta Exitosa:", data);
        alert(`¡Jornada procesada! Documento guardado con ID: ${data.docId || 'N/A'}`);

    } catch (error) {
        console.error('Error de conexión o red:', error);
        setUploadStatus('error');
        alert("Error de conexión. Asegúrate de que el backend esté corriendo.");
    } finally {
        setIsUploading(false);
    }
  };

  // ----------------------------------------------------------------------

  const buttonDisabled = !imagenAsignacion || !pdfSanciones || isUploading;

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
          
          {/* Campo de Imagen de Asignación */}
          <div className="space-y-2">
            {/* ... (mismo JSX para imagen) ... */}
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <IoImage className="mr-1 text-emerald-500" />
              1. Imagen de Asignación (Jornada)
            </label>
            <input
              type="file"
              accept="image/*"
              // Usamos el nombre de campo 'scheduleImage'
              onChange={(e) => handleFileChange(e, setImagenAsignacion)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {imagenAsignacion && <p className="text-xs text-gray-500 mt-1">Archivo cargado: {imagenAsignacion.name}</p>}
          </div>

          {/* Campo de PDF de Sanciones */}
          <div className="space-y-2">
            {/* ... (mismo JSX para PDF) ... */}
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <IoDocumentText className="mr-1 text-red-500" />
              2. Documento PDF (Sanciones)
            </label>
            <input
              type="file"
              accept=".pdf"
              // Usamos el nombre de campo 'sanctionsPdf'
              onChange={(e) => handleFileChange(e, setPdfSanciones)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
            {pdfSanciones && <p className="text-xs text-gray-500 mt-1">Archivo cargado: {pdfSanciones.name}</p>}
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