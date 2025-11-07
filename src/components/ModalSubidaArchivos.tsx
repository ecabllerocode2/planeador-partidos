import React, { useState } from 'react';
import { IoClose, IoDocumentText, IoCloudUpload, IoCheckmarkCircle, IoWarning, IoCode } from 'react-icons/io5';

// Definición de las interfaces para mejor tipado (ajustado para el nuevo flujo)
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
  // Estado para el JSON ingresado en el textarea
  const [jsonDataInput, setJsonDataInput] = useState('');
  // Estado para el ID de la jornada
  const [jornadaIdInput, setJornadaIdInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  // Manejador para el ID de Jornada
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

  // Manejador para el cambio en el TextArea
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonDataInput(e.target.value);
    setUploadStatus('idle');
  };

  const handleUpload = async () => {
    // 1. Validaciones
    if (!jornadaIdInput) {
      alert("Por favor, ingresa el Identificador de Jornada.");
      return;
    }
    if (!jsonDataInput) {
      alert("Por favor, ingresa el JSON de datos.");
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonDataInput);
    } catch (error) {
      alert("❌ Error: El JSON ingresado no es válido. Revisa la sintaxis.");
      return;
    }

    // Validación de estructura mínima
    if (!parsedData.partidos || !Array.isArray(parsedData.partidos) ||
        !parsedData.sanciones || !Array.isArray(parsedData.sanciones)) {
        alert("❌ Error: El JSON debe contener arrays 'partidos' y 'sanciones' en el nivel raíz.");
        return;
    }


    setIsUploading(true);
    setUploadStatus('idle');

    // Estructura de la data que enviamos al backend
    const payload = {
      jornadaId: jornadaIdInput,
      data: parsedData
    };

    // Asegúrate de que esta URL sea la correcta para tu endpoint de Vercel.
    const ENDPOINT_URL = 'https://planeador-partidos-backend.vercel.app/api/extract-schedule';

    try {
      const response = await fetch(ENDPOINT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // ¡Cambiamos a JSON!
        },
        body: JSON.stringify(payload),
      });

      let data: BackendResponse = {};

      try {
        data = await response.json();
      } catch (e) {
        console.warn("⚠️ Fallo en response.json(). Respuesta no JSON del backend.");
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

      const successMsg = `🎉 ¡Jornada procesada con éxito! Documento guardado con ID: ${docId}.\nPartidos guardados: ${totalP}\nSanciones guardadas: ${totalS}`;

      // Resetear inputs tras éxito
      setJsonDataInput('');
      // setJornadaIdInput(''); // Opcional, dependiendo de si se carga una jornada tras otra.
      alert(successMsg);

    } catch (error) {
      console.error('Error de conexión o red fatal:', error);
      setUploadStatus('error');
      alert("🚨 Error de conexión. Revisa el estado de tu red. (El servidor no fue alcanzado).");
    } finally {
      setIsUploading(false);
    }
  };

  // El botón ahora se habilita si hay ID de jornada y algo en el JSON textarea
  const buttonDisabled = !jornadaIdInput || !jsonDataInput || isUploading;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">

        <div className="p-5 border-b flex justify-between items-center bg-blue-600 rounded-t-xl">
          <h2 className="text-xl font-extrabold text-white flex items-center">
            <IoCode className="mr-2 text-white" />
            Cargar Datos de Jornada (JSON)
          </h2>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition">
            <IoClose className="text-2xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* 1. Campo de Jornada */}
          <div className="space-y-2 border-l-4 border-blue-500 p-3 bg-blue-50 rounded-lg">
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

          {/* 2. Campo de JSON de Datos */}
          <div className="space-y-2 border-l-4 border-emerald-500 p-3 bg-emerald-50 rounded-lg">
            <label className="block text-sm font-bold text-gray-800 flex items-center mb-2">
              <IoDocumentText className="mr-1 text-emerald-500" />
              2. Datos Combinados de Partidos y Sanciones (JSON) - Requerido
            </label>
            <textarea
              placeholder={`Ingresa el JSON con las claves "partidos" y "sanciones". Ejemplo:\n\n{\n  "partidos": [\n    {\n      "fecha": "2025-01-20",\n      "hora": "19:00",\n      "local": "Equipo A",\n      "visitante": "Equipo B"\n    }\n  ],\n  "sanciones": [\n    {\n      "nombre": "Juan Pérez",\n      "equipo": "Equipo A"\n    }\n  ]\n}`}
              value={jsonDataInput}
              onChange={handleJsonChange}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs resize-none focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
            <p className="text-xs text-gray-600 mt-1">Asegúrate de que la sintaxis JSON sea perfecta.</p>
          </div>


          {uploadStatus === 'success' && (
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg flex items-center font-semibold border border-emerald-300">
              <IoCheckmarkCircle className="mr-2 text-xl" /> ¡Datos guardados en Firestore!
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center font-semibold border border-red-300">
              <IoClose className="mr-2 text-xl" /> Error al procesar los datos.
            </div>
          )}

        </div>

        <div className="p-5 border-t">
          <button
            onClick={handleUpload}
            disabled={buttonDisabled}
            className={`w-full py-3 font-extrabold rounded-lg shadow-lg transition transform hover:scale-[1.01] ${buttonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <IoCloudUpload className="animate-pulse mr-2" />
                Validando y Guardando...
              </span>
            ) : (
              "GUARDAR DATOS EN FIRESTORE"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSubidaArchivos;