import React, { useState, useEffect, useRef } from 'react';
import { FormData, RubricData } from './types';
import { generateRubric, fetchCurriculumCriteria, suggestCompetencies, suggestEvaluationItems } from './services/geminiService';
import Header from './components/Header';
import RubricForm from './components/RubricForm';
import RubricDisplay from './components/RubricDisplay';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';

const KEY_COMPETENCIES = [
  'Competencia en comunicación lingüística (CCL)',
  'Competencia plurilingüe (CP)',
  'Competencia matemática y en ciencia, tecnología e ingeniería (STEM)',
  'Competencia digital (CD)',
  'Competencia personal, social y de aprender a aprender (CPSAA)',
  'Competencia ciudadana (CC)',
  'Competencia emprendedora (CE)',
  'Competencia en conciencia y expresión culturales (CCEC)',
];

const STAGES = ['Secundaria', 'Primaria', 'Infantil'];

const INFANTIL_GRADES = ['3 años', '4 años', '5 años'];
const PRIMARY_GRADES = ['1º de Primaria', '2º de Primaria', '3º de Primaria', '4º de Primaria', '5º de Primaria', '6º de Primaria'];
const SECONDARY_GRADES = [
    '1º de E.S.O.',
    '2º de E.S.O.',
    '3º de E.S.O.',
    '4º de E.S.O.',
];

const INFANTIL_SUBJECTS = [
    'Crecimiento en Armonía',
    'Descubrimiento y Exploración del Entorno',
    'Comunicación y Representación de la Realidad',
];
const PRIMARY_SUBJECTS = [
    'Ciencias de la Naturaleza',
    'Ciencias Sociales',
    'Educación Artística',
    'Educación Física',
    'Lengua Castellana y Literatura',
    'Lengua Extranjera (Inglés)',
    'Matemáticas',
    'Valores Cívicos y Éticos',
];
const SECONDARY_SUBJECTS = [
    'Biología y Geología',
    'Educación Física',
    'Educación Plástica, Visual y Audiovisual',
    'Física y Química',
    'Geografía e Historia',
    'Lengua Castellana y Literatura',
    'Lengua Extranjera (Inglés)',
    'Lengua Extranjera (Francés)',
    'Matemáticas',
    'Música',
    'Tecnología y Digitalización',
    'Valores Cívicos y Éticos',
];

const getGradesForStage = (stage: string): string[] => {
    switch (stage) {
        case 'Infantil': return INFANTIL_GRADES;
        case 'Primaria': return PRIMARY_GRADES;
        case 'Secundaria': return SECONDARY_GRADES;
        default: return [];
    }
};

const getSubjectsForStage = (stage: string): string[] => {
    switch (stage) {
        case 'Infantil': return INFANTIL_SUBJECTS;
        case 'Primaria': return PRIMARY_SUBJECTS;
        case 'Secundaria': return SECONDARY_SUBJECTS;
        default: return [];
    }
};


const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    stage: 'Secundaria',
    subject: 'Lengua Castellana y Literatura',
    grade: '2º de E.S.O.',
    topic: 'Análisis de un texto narrativo.',
    criteria: '1.1. Identificar los elementos de la narración (narrador, personajes, espacio y tiempo).\n2.2. Analizar la estructura del relato (planteamiento, nudo y desenlace).\n3.1. Utilizar correctamente la terminología literaria en el análisis de textos.',
    levels: [
      { nombre: 'Sobresaliente', puntuacion: '9-10' },
      { nombre: 'Notable', puntuacion: '7-8' },
      { nombre: 'Bien', puntuacion: '6' },
      { nombre: 'Suficiente', puntuacion: '5' },
      { nombre: 'Insuficiente', puntuacion: '1-4' },
    ],
    competencies: [
      'Competencia en comunicación lingüística (CCL)',
      'Competencia digital (CD)',
      'Competencia personal, social y de aprender a aprender (CPSAA)',
    ],
    evaluationItems: [
      { name: '1. Comprensión del texto', weight: '40' },
      { name: '2. Análisis de elementos narrativos', weight: '30' },
      { name: '3. Expresión y uso del vocabulario', weight: '30' },
    ],
  });
  const [rubricData, setRubricData] = useState<RubricData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingCriteria, setIsFetchingCriteria] = useState<boolean>(false);
  const [isSuggestingCompetencies, setIsSuggestingCompetencies] = useState<boolean>(false);
  const [isSuggestingItems, setIsSuggestingItems] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);


  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    const newGrades = getGradesForStage(formData.stage);
    const newSubjects = getSubjectsForStage(formData.stage);

    setFormData(prev => ({
        ...prev,
        grade: newGrades[0] || '',
        subject: newSubjects[0] || '',
        criteria: '',
        competencies: [],
    }));

  }, [formData.stage]);

  const handleFetchCriteria = async () => {
    if (!formData.stage || !formData.subject || !formData.grade || formData.evaluationItems.length === 0) return;
    setIsFetchingCriteria(true);
    setError(null);
    try {
        const criteriaList = await fetchCurriculumCriteria(formData.stage, formData.subject, formData.grade, formData.evaluationItems.length);
        setFormData(prev => ({...prev, criteria: criteriaList.join('\n')}));
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Ha ocurrido un error inesperado al cargar los criterios.');
          }
    } finally {
        setIsFetchingCriteria(false);
    }
  };

  const handleSuggestCompetencies = async () => {
    if (!formData.stage || !formData.subject || !formData.topic) return;
    setIsSuggestingCompetencies(true);
    setError(null);
    try {
        const suggested = await suggestCompetencies(formData.stage, formData.subject, formData.topic, KEY_COMPETENCIES);
        setFormData(prev => ({...prev, competencies: suggested}));
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Ha ocurrido un error inesperado al sugerir competencias.');
        }
    } finally {
        setIsSuggestingCompetencies(false);
    }
  };

  const handleSuggestItems = async () => {
    if (!formData.stage || !formData.subject || !formData.topic) return;
    setIsSuggestingItems(true);
    setError(null);
    try {
        const suggestedItems = await suggestEvaluationItems(formData.stage, formData.subject, formData.topic);
        setFormData(prev => ({...prev, evaluationItems: suggestedItems}));
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Ha ocurrido un error inesperado al sugerir ítems.');
        }
    } finally {
        setIsSuggestingItems(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setRubricData(null);

    try {
      const data = await generateRubric(formData);
      setRubricData(data);
    } catch (err) { 
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ha ocurrido un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-slate-900 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        <div className="mt-8 max-w-4xl mx-auto bg-gray-100 text-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
          <RubricForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isFetchingCriteria={isFetchingCriteria}
            isSuggestingCompetencies={isSuggestingCompetencies}
            isSuggestingItems={isSuggestingItems}
            onFetchCriteria={handleFetchCriteria}
            onSuggestCompetencies={handleSuggestCompetencies}
            onSuggestItems={handleSuggestItems}
            keyCompetencies={KEY_COMPETENCIES}
            stages={STAGES}
            subjects={getSubjectsForStage(formData.stage)}
            grades={getGradesForStage(formData.stage)}
          />
        </div>
        
        <div className="mt-8 max-w-6xl mx-auto">
          {isLoading && (
            <div className="max-w-4xl mx-auto bg-gray-100 text-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
              <Loader />
            </div>
          )}
          <ErrorMessage message={error || ''} />
          {rubricData && <RubricDisplay data={rubricData} levelsConfig={formData.levels} />}
        </div>
      </main>
    </div>
  );
};

export default App;