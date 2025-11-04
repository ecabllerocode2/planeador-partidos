import React, { useState } from 'react'; // ✅ CORRECCIÓN DE IMPORTACIÓN
import { useNavigate } from 'react-router-dom';
import type { StatsCache } from '../App'; 


// ====================================================================
// ICONOS SVG (Dejamos los iconos aquí para mantener la autocontención del componente)
// ====================================================================

const SvgIcon = ({ path, className = 'w-5 h-5', style = {} }: { path: string, className?: string, style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
    </svg>
);
const ArrowBackIcon = (props: any) => ( <SvgIcon path="M19 12H5M12 19l-7-7 7-7" {...props} /> );  
const ListIcon = (props: any) => ( <SvgIcon path="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" {...props} /> ); 
const PeopleIcon = (props: any) => ( <SvgIcon path="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2M15 9a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...props} /> );


// ====================================================================
// INTERFACES Y COMPONENTE HELPER: CategoryAccordion
// ====================================================================

interface StatsViewProps {
    statsCache: StatsCache;
}

interface CategoryAccordionProps {
    categoria: string;
    // La interfaz del array de standings debe ser la misma que en App.tsx
    standings: { equipo: string; posicion: string | number; [key: string]: any }[];
}

const CategoryAccordion: React.FC<CategoryAccordionProps> = ({ categoria, standings }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Nombres de campos que coinciden con tu DB de Firestore
    const fields = ['posicion', 'equipo', 'pj', 'pg', 'pe', 'pp', 'gf', 'gc', 'dg', 'pts'];

    if (!standings || standings.length === 0) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500 text-yellow-800">
                <p className="font-bold text-gray-800">Categoría: {categoria}</p>
                <p className="text-sm">No hay datos de clasificación (standings) disponibles para esta categoría.</p>
            </div>
        );
    }

    const formatHeader = (field: string) => {
        if (field === 'posicion') return 'Pos';
        if (field === 'equipo') return 'Equipo';
        if (field === 'pj') return 'PJ';
        if (field === 'pts') return 'Pts';
        return field.toUpperCase();
    }

    return (
        <div className="border border-gray-200 rounded-xl shadow-lg overflow-hidden bg-white mb-4 transition-all duration-300">
            
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition duration-200"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <PeopleIcon className="mr-3 w-6 h-6 text-emerald-600" />
                    Categoría: {categoria}
                </h3>
                <svg
                    className={`w-6 h-6 text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            
            {isOpen && (
                <div className="p-4 pt-0 transition-all duration-300 ease-in-out border-t border-gray-100">
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    {fields.map(field => (
                                        <th key={field} className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center first:text-left">
                                            {formatHeader(field)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {standings
                                    .sort((a, b) => {
                                        const posA = Number(a.posicion);
                                        const posB = Number(b.posicion);
                                        if (isNaN(posA) || isNaN(posB)) return 0;
                                        return posA - posB;
                                    })
                                    .map((team, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                                        {fields.map(field => (
                                            <td 
                                                key={field} 
                                                className={`px-3 py-2 whitespace-nowrap text-gray-700 text-center ${field === 'equipo' ? 'text-left font-semibold' : 'font-medium'}`}
                                            >
                                                {team[field as keyof typeof team]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};


// ====================================================================
// COMPONENTE PRINCIPAL StatsView
// ====================================================================

const StatsView: React.FC<StatsViewProps> = ({ statsCache }) => {
    const navigate = useNavigate();
    
    // --- LÓGICA DE PRIORIZACIÓN DE CATEGORÍAS ---
    
    // 1. Definir las categorías prioritarias en el orden deseado
    const priorityCategories = ["4ta Asc", "4ta pre"]; 
    
    // 2. Obtener todas las categorías disponibles
    const allCategories = Object.keys(statsCache);
    
    // 3. Separar las categorías: Prioritarias vs. Resto
    const prioritized: string[] = [];
    const remaining: string[] = [];

    allCategories.forEach(category => {
        if (priorityCategories.includes(category)) {
            prioritized.push(category);
        } else {
            remaining.push(category);
        }
    });

    // 4. Ordenar las categorías restantes alfabéticamente
    remaining.sort();

    // 5. Ordenar las categorías prioritarias en el orden definido
    const sortedPrioritized = priorityCategories.filter(cat => prioritized.includes(cat));

    // 6. Combinar las listas: Prioritarias primero, luego el resto ordenado
    const categories = [...sortedPrioritized, ...remaining];
    
    const isLoading = categories.length === 0 && Object.keys(statsCache).length === 0;
    // ---------------------------------------------

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 bg-gray-50">
            
            {/* Encabezado */}
            <div className="flex items-center justify-start pb-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center text-emerald-600 font-semibold hover:text-emerald-800 transition py-1 px-3 rounded-lg bg-white shadow-sm border border-gray-200"
                >
                    <ArrowBackIcon className="mr-2 w-5 h-5" />
                    Volver
                </button>
            </div>
            
            {/* Título de la sección */}
            <h2 className="text-3xl font-extrabold text-gray-900 flex items-center">
                <ListIcon className="mr-3 w-8 h-8 text-emerald-600" />
                Clasificación de Categorías
            </h2>

            
            {/* Contenido */}
            {isLoading ? (
                <div className="p-12 text-center bg-white rounded-xl shadow-lg text-gray-500 font-medium">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando datos de clasificación...
                </div>
            ) : (
                <div className="space-y-4">
                    
                    {categories.map(category => (
                        <CategoryAccordion
                            key={category}
                            categoria={category}
                            standings={statsCache[category]?.standings || []}
                        />
                    ))}
                </div>
            )}
            
        </div>
    );
};

export default StatsView;