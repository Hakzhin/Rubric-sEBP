
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, RubricData, EvaluationItemConfig } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

export const suggestCompetencies = async (stage: string, subject: string, topic: string, allCompetencies: string[]): Promise<string[]> => {
    const competenciesSchema = {
        type: Type.OBJECT,
        properties: {
            competencias: {
                type: Type.ARRAY,
                description: 'Lista de las competencias clave más relevantes.',
                items: {
                    type: Type.STRING,
                }
            }
        },
        required: ['competencias'],
    };

    const prompt = `
        Actúa como un experto en el currículo educativo español (LOMLOE), basándote en los decretos oficiales para la Región de Murcia (publicados en portales como 'educarm.es').
        Tu tarea es identificar las competencias clave más relevantes para un tema específico dentro de una asignatura y etapa educativa.

        **Etapa Educativa:** ${stage}
        **Asignatura:** ${subject}
        **Tema a evaluar:** ${topic}

        **Lista completa de competencias clave disponibles para seleccionar:**
        ${allCompetencies.join('\n')}

        Instrucciones:
        1. Analiza la etapa, asignatura y el tema proporcionados.
        2. De la lista completa, selecciona las 3 o 4 competencias clave que se trabajan de forma más directa y evidente en el tema.
        3. Devuelve únicamente un objeto JSON que se ajuste al esquema proporcionado, con la clave "competencias", que contenga un array con los nombres COMPLETOS y EXACTOS de las competencias seleccionadas. No incluyas texto introductorio ni explicaciones.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: competenciesSchema,
                temperature: 0.3,
            },
        });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText) as { competencias: string[] };

        if (!parsedData.competencias || !Array.isArray(parsedData.competencias)) {
            throw new Error("La respuesta de la API no contiene una lista de competencias válida.");
        }
        
        return parsedData.competencias;

    } catch (error) {
        console.error("Error al sugerir competencias:", error);
        if (error instanceof Error) {
            throw new Error(`No se pudieron sugerir las competencias: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido al sugerir competencias.");
    }
};

export const fetchCurriculumCriteria = async (stage: string, subject: string, grade: string, count: number): Promise<string[]> => {
    const criteriaSchema = {
        type: Type.OBJECT,
        properties: {
            criterios: {
                type: Type.ARRAY,
                description: `Lista de los ${count} criterios de evaluación más importantes.`,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        numero: {
                            type: Type.STRING,
                            description: 'El número oficial del criterio (ej: "1.1", "2.3").'
                        },
                        descripcion: {
                            type: Type.STRING,
                            description: 'El texto completo del criterio de evaluación.'
                        }
                    },
                    required: ['numero', 'descripcion']
                }
            }
        },
        required: ['criterios'],
    };

    const prompt = `
        Actúa como un experto en el currículo educativo de España (LOMLOE), específicamente para la Región de Murcia en la etapa de ${stage}.
        Tu tarea es proporcionar los criterios de evaluación oficiales, incluyendo su numeración, para la siguiente asignatura y curso, basándote en la información oficial publicada por la Consejería de Educación de la Región de Murcia (disponible en portales como 'educarm.es').

        **Etapa Educativa:** ${stage}
        **Asignatura:** ${subject}
        **Curso:** ${grade}
        **Número de criterios a seleccionar:** ${count}

        Instrucciones:
        1. De todos los criterios de evaluación oficiales para esta materia y nivel, selecciona los ${count} más importantes y representativos.
        2. Para cada criterio, proporciona su numeración oficial (ej: "1.1", "2.3") y su descripción completa.
        3. Devuelve el resultado únicamente en formato JSON, ajustándote al esquema proporcionado. No incluyas texto introductorio ni explicaciones adicionales fuera del JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: criteriaSchema,
                temperature: 0.2,
            },
        });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText) as { criterios: { numero: string, descripcion: string }[] };

        if (!parsedData.criterios || !Array.isArray(parsedData.criterios)) {
            throw new Error("La respuesta de la API no contiene una lista de criterios válida.");
        }
        
        return parsedData.criterios.map(c => `${c.numero}. ${c.descripcion}`);

    } catch (error) {
        console.error("Error al obtener los criterios del currículo:", error);
        if (error instanceof Error) {
            throw new Error(`No se pudieron cargar los criterios: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido al buscar los criterios.");
    }
};

export const suggestEvaluationItems = async (stage: string, subject: string, topic: string): Promise<EvaluationItemConfig[]> => {
    const itemsSchema = {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                description: 'Lista de 3 a 5 ítems de evaluación con sus pesos porcentuales, que sumen 100.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: 'El nombre del ítem a evaluar (ej: "Análisis de Estructura").'
                        },
                        weight: {
                            type: Type.STRING,
                            description: 'El peso porcentual como un string numérico sin el símbolo % (ej: "40").'
                        }
                    },
                    required: ['name', 'weight']
                }
            }
        },
        required: ['items'],
    };

    const prompt = `
        Actúa como un experto en diseño curricular y pedagogía para el sistema educativo español (LOMLOE).
        Tu tarea es proponer una lista de ítems de evaluación ponderados para una rúbrica.

        **Etapa Educativa:** ${stage}
        **Asignatura:** ${subject}
        **Tema a evaluar:** ${topic}

        Instrucciones:
        1.  Analiza el tema en el contexto de la asignatura y la etapa.
        2.  Genera entre 3 y 5 ítems de evaluación que sean claros, relevantes y medibles para el tema propuesto.
        3.  Asigna un peso porcentual a cada ítem. La suma de todos los pesos DEBE ser exactamente 100.
        4.  Devuelve el resultado únicamente en formato JSON, ajustándote al esquema proporcionado. No incluyas explicaciones ni texto introductorio. Los pesos deben ser strings numéricos.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: itemsSchema,
                temperature: 0.5,
            },
        });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText) as { items: EvaluationItemConfig[] };
        
        if (!parsedData.items || !Array.isArray(parsedData.items)) {
            throw new Error("La respuesta de la API no contiene una lista de ítems válida.");
        }
        
        const totalWeight = parsedData.items.reduce((sum, item) => sum + (parseInt(item.weight, 10) || 0), 0);
        if (totalWeight !== 100 && parsedData.items.length > 0) {
             console.warn(`La API devolvió ítems con un peso total de ${totalWeight} en lugar de 100. Ajustando...`);
             const scale = 100 / totalWeight;
             let adjustedSum = 0;
             const adjustedItems = parsedData.items.map((item, index) => {
                if (index === parsedData.items.length - 1) {
                    return { ...item, weight: String(100 - adjustedSum) };
                }
                const adjustedWeight = Math.round((parseInt(item.weight, 10) || 0) * scale);
                adjustedSum += adjustedWeight;
                return { ...item, weight: String(adjustedWeight) };
             });
             return adjustedItems;
        }

        return parsedData.items;

    } catch (error) {
        console.error("Error al sugerir ítems de evaluación:", error);
        if (error instanceof Error) {
            throw new Error(`No se pudieron sugerir los ítems: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido al sugerir ítems.");
    }
};


export const generateRubric = async (formData: FormData): Promise<RubricData> => {
  const rubricSchema = {
    type: Type.OBJECT,
    properties: {
      rubrica: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            item: {
              type: Type.STRING,
              description: 'El nombre del ítem o dimensión a evaluar (ej: "1. DELIBERACIÓN").',
            },
            peso: {
              type: Type.STRING,
              description: 'El peso porcentual del ítem (ej: "35%").',
            },
            criteriosAsociados: {
              type: Type.ARRAY,
              description: 'Lista de los criterios de evaluación específicos del currículo asociados a este ítem.',
              items: { type: Type.STRING }
            },
            competenciasAsociadas: {
              type: Type.ARRAY,
              description: 'Lista de abreviaturas de las competencias clave que este ítem evalúa. Ej: ["CCL", "CD"]',
              items: {
                type: Type.STRING,
              }
            },
            niveles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nombre: {
                    type: Type.STRING,
                    description: 'El nombre del nivel de desempeño (ej: Insuficiente). Debe coincidir con uno de los nombres proporcionados.',
                  },
                  descripcion: {
                    type: Type.STRING,
                    description: 'Descripción detallada y observable del desempeño en este nivel para el ítem general. Puede contener saltos de línea (\\n) para separar puntos.',
                  },
                },
                 required: ['nombre', 'descripcion'],
              },
            },
          },
          required: ['item', 'peso', 'criteriosAsociados', 'competenciasAsociadas', 'niveles'],
        },
      },
    },
    required: ['rubrica'],
  };

  const prompt = `
    Eres un asistente experto en pedagogía y diseño curricular, especializado en el sistema educativo español (LOMLOE) para la etapa de ${formData.stage} en la Región de Murcia. Tu tarea es crear rúbricas de evaluación complejas y detalladas en formato JSON, siguiendo el modelo de una rúbrica por ítems o dimensiones.

    Basándote en la siguiente información, genera una rúbrica de evaluación:

    **Etapa Educativa:** ${formData.stage}
    **Asignatura:** ${formData.subject}
    **Curso:** ${formData.grade}
    **Tema/Competencia a evaluar:** ${formData.topic}

    **Ítems a evaluar y sus pesos porcentuales (DEBES RESPETARLOS EXACTAMENTE):**
    ${formData.evaluationItems.map(item => `- ${item.name}: ${item.weight}%`).join('\n')}

    **Competencias Clave a trabajar (extrae solo las abreviaturas entre paréntesis, ej: CCL, CD):**
    ${formData.competencies.join(', ')}
    
    **Criterios de Evaluación como Guía (puedes usarlos o buscar otros más adecuados del currículo):**
    ${formData.criteria}

    **Niveles de Desempeño a utilizar (Nombre: Puntuación):**
    ${formData.levels.map(l => `${l.nombre}: ${l.puntuacion}`).join('\n')}

    Instrucciones para la generación:
    1.  **Respeta los Ítems y Pesos:** Utiliza los ítems y pesos porcentuales EXACTOS que se han proporcionado. No los modifiques, inventes ni omitas. El nombre del ítem en el JSON debe ser idéntico al proporcionado.
    2.  **Asocia Criterios Curriculares:** Para CADA ítem, busca y asocia los criterios de evaluación oficiales del currículo de la Región de Murcia que mejor se correspondan, asegurándote de que provienen de fuentes oficiales como 'educarm.es'. Incluye la numeración oficial y la descripción de cada criterio.
    3.  **Asocia Competencias Clave:** Para CADA ítem, identifica y asocia las abreviaturas de las competencias clave más relevantes de la lista proporcionada. Un ítem puede estar asociado a varias competencias.
    4.  **Genera Descriptores:** Para CADA ítem, crea una descripción detallada para CADA uno de los niveles de desempeño solicitados. Estas descripciones deben ser progresivas y observables. Las descripciones para los niveles pueden tener varios puntos o líneas separadas por un salto de línea (\\n) para mayor detalle.
    5.  **Formato de Salida:** Devuelve un objeto JSON válido que se ajuste al esquema proporcionado. El campo 'competenciasAsociadas' debe contener solo las abreviaturas (ej: "CCL", "STEM").
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: rubricSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText) as RubricData;
    
    if (!parsedData.rubrica || !Array.isArray(parsedData.rubrica)) {
      throw new Error("La respuesta de la API no contiene una estructura de rúbrica válida.");
    }

    return parsedData;
  } catch (error) {
    console.error("Error al generar la rúbrica:", error);
    if (error instanceof Error) {
        throw new Error(`Error en la comunicación con la API: ${error.message}`);
    }
    throw new Error("Ocurrió un error desconocido al generar la rúbrica.");
  }
};