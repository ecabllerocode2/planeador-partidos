// src/App.tsx

import Footer from "./components/Footer";
import Header from "./components/Header"
import JornadaCard from "./components/JornadaCard"
import { IoMdAddCircle } from "react-icons/io";
import jornadasData from "./data/jornadas.json"; // Asegúrate de que la ruta sea correcta

// Definición de tipos para la estructura de la jornada, necesaria para TypeScript
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
  // Aquí asumimos que 'jornadasData' se convierte automáticamente en un array de tipo JornadaData[]
  const jornadas: JornadaData[] = jornadasData as JornadaData[]; 
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header titulo="PLANEACIÓN ARBITRAL" />
      
      {/* Añadimos padding-bottom al main que es igual o mayor a la altura del Footer fijo (h-16 = 4rem = 64px)
          para asegurar que el último contenido no quede oculto detrás de la barra de navegación. */}
      <main className="flex-grow p-4 md:p-6 lg:p-8 relative pb-20"> 
        
        {/* Usamos el método 'map' para iterar sobre el array de jornadas. */}
        <div className="space-y-4">
          {jornadas.map((jornada) => (
            // Es crucial usar una 'key' única para cada elemento mapeado
            <JornadaCard key={jornada.id} jornada={jornada} />
          ))}
        </div>
        
        {/* Botón de Acción Flotante (FAB) - Se mantiene la posición corregida */}
        <button 
          aria-label="Agregar Nueva Planeación"
          className="fixed bottom-[5rem] bottom-6 right-6 right-10 
                     text-6xl text-emerald-500 hover:text-emerald-600 transition-colors 
                     shadow-lg rounded-full z-50"
        >
          <IoMdAddCircle />
        </button>
      </main>
      
      <Footer />
    </div>
  )
}

export default App