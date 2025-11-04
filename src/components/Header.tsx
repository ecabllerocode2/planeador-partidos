import logo from "../assets/logo.png"
import { CiMenuFries } from "react-icons/ci";
import { IoLogOut } from "react-icons/io5"; // Icono de Cerrar Sesión
import { getAuth, signOut } from 'firebase/auth'; // Funciones de Firebase Auth
import { useNavigate } from 'react-router-dom'; // Para redirigir

// --- NUEVA INTERFAZ ---
interface HeaderProps {
  titulo: string;
  onLogout: () => void; // Función pasada desde App.tsx para limpiar el estado
  isUserLoggedIn: boolean; // Indica si hay un usuario logueado
}

function Header(props:HeaderProps) {
    // Desestructuramos las nuevas props
    const { titulo, onLogout, isUserLoggedIn } = props;
    const navigate = useNavigate();

    const handleLogout = async () => {
        const auth = getAuth();
        try {
            // 1. Llama a la función de Firebase para cerrar la sesión
            await signOut(auth);
            
            // 2. Limpia el estado local en App.tsx
            onLogout(); 
            
            // 3. Redirige a la página principal (donde aparecerá el LoginView)
            navigate('/'); 
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            alert("Hubo un error al cerrar la sesión. Intenta de nuevo.");
        }
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-screen-xl mx-auto flex items-center justify-between p-4 relative">
                
                {/* 1. Elemento Izquierdo: Logo y Marca */}
                <div className="flex items-center space-x-2">
                    <img 
                        src={logo} 
                        alt="Logo de la Aplicación" 
                        className="w-8 h-8 object-contain"
                    />
                    <h1 className="text-sm font-bold text-gray-800 hidden sm:block">
                        Árbitros Prodefut
                    </h1>
                </div>

                {/* 2. Elemento Central: Título de la Vista */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                        {titulo}
                    </h2>
                </div>
                
                {/* 3. Elemento Derecho: Botón de Logout o Icono de Menú */}
                <div className="w-8 h-8 flex items-center justify-end">
                    {isUserLoggedIn ? (
                        <button
                            onClick={handleLogout}
                            aria-label="Cerrar Sesión"
                            // Estilo para el ícono de Cerrar Sesión (color rojo)
                            className="p-1 text-2xl text-red-500 hover:text-red-700 transition-colors"
                        >
                            <IoLogOut />
                        </button>
                    ) : (
                        // Mantiene el ícono de menú si no está logueado
                        <CiMenuFries className="text-xl text-gray-600" />
                    )}
                </div>
                
            </div>
        </header>
    )
}

export default Header;