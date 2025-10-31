// src/components/Header.tsx

import logo from "../assets/logo.png"
import { CiMenuFries } from "react-icons/ci";

interface HeaderProps {
  titulo: string;
}

function Header(props:HeaderProps) {
    const { titulo } = props;
    

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            {/* CORRECCIÓN 2: Uso de Flex y elementos de anclaje para centrado perfecto.
              - items-center justify-between: Distribuye los tres elementos.
            */}
            <div className="max-w-screen-xl mx-auto flex items-center justify-between p-4 relative">
                
                {/* 1. Elemento Izquierdo: Logo y Marca */}
                <div className="flex items-center space-x-2">
                    <img 
                        src={logo} 
                        alt="Logo de la Aplicación" 
                        className="w-8 h-8 object-contain" // Hacemos el logo un poco más pequeño (w-8 h-8)
                    />
                    {/* Título de la marca más pequeño (text-sm) */}
                    <h1 className="text-sm font-bold text-gray-800 hidden sm:block">
                        Árbitros Prodefut
                    </h1>
                </div>

                {/* 2. Elemento Central: Título de la Vista (Centrado Absoluto) */}
                {/* En lugar de justify-center, usaremos absolute centering para 
                  ignorar los otros elementos y asegurar un centrado visual total.
                */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <h2 className="text-base font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                        {titulo}
                    </h2>
                </div>
                
                {/* 3. Elemento Derecho: Icono de Menú/Acción */}
                {/* Le damos el mismo tamaño (w-8 h-8) al contenedor del icono para balancear el logo (w-8 h-8) */}
                <div className="w-8 h-8 flex items-center justify-end">
                    <CiMenuFries className="text-xl text-gray-600" />
                </div>
                
            </div>
        </header>
    )
}

export default Header;