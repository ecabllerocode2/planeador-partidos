// src/components/Footer.tsx

import { IoDocumentText, IoBarChart, IoPersonCircle } from "react-icons/io5";

// Componente individual para los ítems del Footer
interface FooterItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
}

const FooterItem: React.FC<FooterItemProps> = ({ icon, label, isActive }) => {
    // Definimos el estilo de los iconos basado en si están activos
    const baseClasses = "flex flex-col items-center p-2 transition-colors duration-200";
    const activeClasses = "text-emerald-500 font-bold"; // Color de acento
    const inactiveClasses = "text-gray-500 hover:text-emerald-400";

    return (
        <a 
          href="#" 
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          aria-label={label}
        >
            <div className="text-2xl mb-1">{icon}</div>
            <span className="text-xs">{label}</span>
        </a>
    )
}

function Footer() {
    return (
        <footer 
            // Fijo en la parte inferior para navegación constante en móvil
            className="fixed bottom-0 left-0 right-0 h-16 bg-white shadow-2xl border-t border-gray-200 z-50"
        >
            <nav className="flex justify-around items-center h-full max-w-lg mx-auto">
                {/* Asumimos que "Planeación" es la vista actual (activa) */}
                <FooterItem 
                    icon={<IoDocumentText />} 
                    label="Planeación" 
                    isActive={true} 
                />
                <FooterItem 
                    icon={<IoBarChart />} 
                    label="Estadísticas" 
                    isActive={false} 
                />
                {/* Se podría agregar un tercer ítem como "Perfil" o "Historial" */}
                <FooterItem 
                    icon={<IoPersonCircle />} 
                    label="Perfil" 
                    isActive={false} 
                />
            </nav>
        </footer>
    )
}

export default Footer