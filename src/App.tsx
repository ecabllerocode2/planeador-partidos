// src/App.tsx

import Footer from "./components/Footer";
import Header from "./components/Header"
import JornadaCard from "./components/JornadaCard"
import PartidoDetail from "./components/PartidoDetail"; // 👈 Nuevo componente
import { IoMdAddCircle } from "react-icons/io";
import { Routes, Route, useLocation } from 'react-router-dom'; 
import jornadasData from "./data/jornadas.json";
import { useState } from 'react'; 
import ModalSubidaArchivos from "./components/ModalSubidaArchivos";

// Definición de tipos: se mantienen, son cruciales para la estructura.
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


function App() {
  const jornadas: JornadaData[] = jornadasData as JornadaData[]; 
  const location = useLocation(); // 👈 Hook para saber la ruta actual
  

  // ESTADO DEL MODAL
  // ----------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  // ----------------------------------------------------
  
  // Condición para mostrar/ocultar el FAB y el Footer
  const isHome = location.pathname === '/'; 
  const showFabAndFooter = isHome;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* El título del Header ahora será dinámico según la ruta */}
      <Header titulo={isHome ? "PLANEACIÓN ARBITRAL" : "DETALLE DEL PARTIDO"} />
      
      <main className={`flex-grow p-4 md:p-6 lg:p-8 relative ${showFabAndFooter ? 'pb-20' : ''}`}> 
        
        {/* Rutas: Aquí definimos qué componente se muestra en qué URL */}
        <Routes>
          {/* Ruta principal: Lista de Jornadas */}
          <Route path="/" element={
            <div className="space-y-4">
              {jornadas.map((jornada) => (
                // Pasamos la data de la jornada a la tarjeta
                <JornadaCard key={jornada.id} jornada={jornada} />
              ))}
            </div>
          } />
          
          {/* Nueva Ruta: Detalle de Partido, usando un ID de partido como parámetro */}
          {/* La ruta puede ser algo como /partido/12345 */}
          <Route path="/partido/:partidoId" element={<PartidoDetail />} /> 

          {/* Puedes añadir una ruta para estadísticas aquí también */}
          {/* <Route path="/estadisticas" element={<EstadisticasView />} /> */}
        </Routes>
      </main>
      
      {showFabAndFooter && (
        <>
          {/* Botón de Acción Flotante (FAB) */}
          <button 
          onClick={openModal}
            aria-label="Agregar Nueva Planeación"
            className="fixed bottom-[5rem] bottom-6 right-6 right-10 
                       text-6xl text-emerald-500 hover:text-emerald-600 transition-colors 
                       shadow-lg rounded-full z-50"
          >
            <IoMdAddCircle />
          </button>
          <Footer />
        </>
      )}
      {/* ---------------------------------------------------- */}
      {/* RENDERIZADO DEL MODAL (Se renderiza en la vista Home) */}
      {/* ---------------------------------------------------- */}
      <ModalSubidaArchivos 
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}

export default App