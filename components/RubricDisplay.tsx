import React, { useRef, useState } from 'react';
import { RubricData, LevelDefinition } from '../types';

interface RubricDisplayProps {
  data: RubricData;
  levelsConfig: LevelDefinition[];
}

const generateGradientColors = (numLevels: number): string[] => {
    if (numLevels <= 1) return ['#22c55e']; 
    const colors: string[] = [];
    // Hues: 120 (green) -> 0 (red)
    const startHue = 120;
    const endHue = 0;
  
    for (let i = 0; i < numLevels; i++) {
      const progress = i / (numLevels - 1);
      const hue = startHue + progress * (endHue - startHue);
      // Using consistent saturation and lightness for a pleasant look
      colors.push(`hsl(${hue}, 90%, 55%)`);
    }
    return colors.reverse(); // Reverse to have green for best performance
};


const RubricDisplay: React.FC<RubricDisplayProps> = ({ data, levelsConfig }) => {
  const rubricRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!data || !data.rubrica || data.rubrica.length === 0) {
    return null;
  }
  
  const handlePrint = () => {
    if (!rubricRef.current) return;

    const tableHTML = rubricRef.current.querySelector('table')?.outerHTML;
    if (!tableHTML) {
        alert('No se encontró la tabla para imprimir.');
        return;
    }

    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Imprimir Rúbrica</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body {
                        margin: 1.5rem;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    table {
                        font-size: 10pt;
                        width: 100%;
                    }
                    thead th {
                       -webkit-print-color-adjust: exact !important;
                       color-adjust: exact !important;
                    }
                </style>
            </head>
            <body>
                <h2 class="text-2xl font-bold mb-4">Rúbrica Generada</h2>
                ${tableHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 1000);
    } else {
        alert('No se pudo abrir la ventana de impresión. Por favor, asegúrate de que tu navegador no esté bloqueando las ventanas emergentes (pop-ups).');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!rubricRef.current) return;

    const tableHTML = rubricRef.current.querySelector('table')?.outerHTML;
    if (!tableHTML) return;

    try {
        const blob = new Blob([tableHTML], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([clipboardItem]);

        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
        console.error('Failed to copy: ', err);
        alert('No se pudo copiar la tabla. Es posible que tu navegador no sea compatible con esta función.');
    }
  };


  const headerColors = generateGradientColors(levelsConfig.length);

  return (
    <div ref={rubricRef} className="mt-8 bg-gray-100 border border-gray-200 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Rúbrica Generada</h2>
        <div className="flex items-center gap-2 no-print">
            {copySuccess && <span className="text-sm text-green-600 transition-opacity duration-300">¡Copiado!</span>}
            <button
                onClick={handleCopyToClipboard}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Copiar para pegar en Google Docs"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copiar para Google Docs
            </button>
            <button
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Imprimir Rúbrica"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Imprimir
            </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-1/3"
              >
                Ítem / Criterios de Evaluación
              </th>
              {levelsConfig.map((level, index) => (
                <th
                  key={level.nombre}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: headerColors[index] }}
                >
                  <span className="block">{level.nombre}</span>
                  <span className="block font-normal opacity-90">({level.puntuacion})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.rubrica.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-normal text-sm align-top">
                  <div className="font-bold text-gray-900 flex justify-between items-start">
                    <span className="flex-1">{item.item}</span>
                    <span className="ml-4 font-semibold text-gray-500 whitespace-nowrap">{item.peso}</span>
                  </div>
                  <div className="mt-2 text-gray-600 text-xs space-y-1">
                    {item.criteriosAsociados.map((crit, i) => <p key={i}>{crit}</p>)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.competenciasAsociadas.map(comp => (
                      <span key={comp} className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {comp}
                      </span>
                    ))}
                  </div>
                </td>
                {levelsConfig.map(levelConfig => {
                    const levelData = item.niveles.find(l => l.nombre === levelConfig.nombre);
                    return (
                        <td key={levelConfig.nombre} className="px-6 py-4 whitespace-normal text-sm text-gray-700 align-top">
                            {levelData ? levelData.descripcion.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>) : ''}
                        </td>
                    );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RubricDisplay;