import React from 'react';
// Importamos useNavigate para la navegación programática, aunque usaremos <a> para simplicidad
import { IoDocumentText, IoBarChart, IoPersonCircle } from "react-icons/io5";

// ====================================================================
// INTERFACES
// ====================================================================

// Prop que se pasa al Footer desde App.tsx
interface FooterProps {
    currentPath: string; // ✅ Propiedad agregada
}

// Componente individual para los ítems del Footer
interface FooterItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    href: string; // ✅ Añadimos el destino de la navegación
}

// ====================================================================
// COMPONENTE ITEM
// ====================================================================

const FooterItem: React.FC<FooterItemProps> = ({ icon, label, isActive, href }) => {
    // Definimos el estilo de los iconos basado en si están activos
    const baseClasses = "flex flex-col items-center p-2 transition-colors duration-200";
    const activeClasses = "text-emerald-500 font-bold"; // Color de acento
    const inactiveClasses = "text-gray-500 hover:text-emerald-400";

    return (
        <a 
          // Usamos 'href' para la navegación, ya que estamos envueltos en BrowserRouter
          href={href} 
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          aria-label={label}
        >
            <div className="text-2xl mb-1">{icon}</div>
            <span className="text-xs">{label}</span>
        </a>
    )
}

// ====================================================================
// COMPONENTE FOOTER PRINCIPAL
// ====================================================================

function Footer({ currentPath }: FooterProps) { // ✅ Recibimos currentPath como prop

    // Lógica para determinar qué ítem está activo
    
    // "Planeación" es activo si estamos en la ruta principal ('/') o en el detalle de un partido ('/partido/...')
    const isPlaneacionActive = currentPath === '/' || currentPath.startsWith('/partido/');
    
    // "Estadísticas" es activo si estamos exactamente en '/stats'
    const isStatsActive = currentPath === '/stats';

    // "Perfil" (placeholder) es activo si estamos en '/profile'
    const isProfileActive = currentPath === '/profile';

    return (
        <footer 
            // Fijo en la parte inferior para navegación constante en móvil
            className="fixed bottom-0 left-0 right-0 h-16 bg-white shadow-2xl border-t border-gray-200 z-50"
        >
            <nav className="flex justify-around items-center h-full max-w-lg mx-auto">
                
                {/* 1. Botón de Planeación (Ruta Home) */}
                <FooterItem 
                    icon={<IoDocumentText />} 
                    label="Planeación" 
                    href="/" // Navega a Home
                    isActive={isPlaneacionActive} 
                />
                
                {/* 2. Botón de Estadísticas (Ruta /stats) */}
                <FooterItem 
                    icon={<IoBarChart />} 
                    label="Estadísticas" 
                    href="/stats" // ✅ Navega a la nueva ruta
                    isActive={isStatsActive} 
                />
                
                {/* 3. Botón de Perfil (Placeholder) */}
                <FooterItem 
                    icon={<IoPersonCircle />} 
                    label="Perfil" 
                    href="/profile" 
                    isActive={isProfileActive} 
                />
            </nav>
        </footer>
    )
}

export default Footer
