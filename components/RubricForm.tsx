import React from 'react';
import { FormData, LevelDefinition, EvaluationItemConfig } from '../types';

interface RubricFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isFetchingCriteria: boolean;
  isSuggestingCompetencies: boolean;
  isSuggestingItems: boolean;
  onFetchCriteria: () => Promise<void>;
  onSuggestCompetencies: () => Promise<void>;
  onSuggestItems: () => Promise<void>;
  keyCompetencies: string[];
  stages: string[];
  subjects: string[];
  grades: string[];
}

const SelectField: React.FC<{
    id: 'subject' | 'grade' | 'stage';
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: (string | number)[];
  }> = ({ id, label, value, onChange, options }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      >
        <option value="" disabled>Selecciona una opción</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
  

const TextAreaField: React.FC<{
  id: keyof Omit<FormData, 'levels' | 'competencies' | 'stage' | 'evaluationItems'>;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows: number;
  children?: React.ReactNode;
}> = ({ id, label, value, onChange, placeholder, rows, children }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
    <textarea
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      required
    />
  </div>
);


const RubricForm: React.FC<RubricFormProps> = ({ formData, setFormData, onSubmit, isLoading, isFetchingCriteria, isSuggestingCompetencies, isSuggestingItems, onFetchCriteria, onSuggestCompetencies, onSuggestItems, keyCompetencies, stages, subjects, grades }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompetencyChange = (competency: string) => {
    setFormData(prev => {
      const newCompetencies = prev.competencies.includes(competency)
        ? prev.competencies.filter(c => c !== competency)
        : [...prev.competencies, competency];
      return { ...prev, competencies: newCompetencies };
    });
  };

  const handleLevelChange = (index: number, field: keyof LevelDefinition, value: string) => {
    setFormData(prev => {
      const newLevels = [...prev.levels];
      newLevels[index] = { ...newLevels[index], [field]: value };
      return { ...prev, levels: newLevels };
    });
  };

  const addLevel = () => {
    setFormData(prev => ({
      ...prev,
      levels: [...prev.levels, { nombre: '', puntuacion: '' }]
    }));
  };

  const removeLevel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof EvaluationItemConfig, value: string) => {
    setFormData(prev => {
      const newItems = [...prev.evaluationItems];
      if (field === 'weight') {
        const numericValue = value.replace(/[^0-9]/g, '');
        newItems[index] = { ...newItems[index], [field]: numericValue };
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
      return { ...prev, evaluationItems: newItems };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      evaluationItems: [...prev.evaluationItems, { name: '', weight: '' }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evaluationItems: prev.evaluationItems.filter((_, i) => i !== index)
    }));
  };
  
  const totalWeight = formData.evaluationItems.reduce((sum, item) => sum + (parseInt(item.weight, 10) || 0), 0);

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField
                id="stage"
                label="Etapa Educativa"
                value={formData.stage}
                onChange={handleInputChange}
                options={stages}
            />
            <SelectField
                id="grade"
                label="Curso"
                value={formData.grade}
                onChange={handleInputChange}
                options={grades}
            />
             <div className="md:col-span-2">
                <SelectField
                    id="subject"
                    label="Asignatura / Ámbito"
                    value={formData.subject}
                    onChange={handleInputChange}
                    options={subjects}
                />
            </div>
        </div>
        <TextAreaField
            id="topic"
            label="Tema o Competencia a Evaluar"
            value={formData.topic}
            onChange={handleInputChange}
            placeholder="Ej: El análisis de textos narrativos y la identificación de sus elementos."
            rows={2}
        />
      </div>

      <hr className="border-gray-200" />
      
       {/* Ítems a Evaluar */}
       <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <label className="block text-base font-medium text-gray-900">Ítems a Evaluar y Ponderación</label>
                <button
                    type="button"
                    onClick={onSuggestItems}
                    disabled={!formData.subject || !formData.topic || isSuggestingCompetencies || isLoading || isFetchingCriteria || isSuggestingItems}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    title="Sugerir ítems de evaluación con IA"
                >
                     {isSuggestingItems ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Sugiriendo...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Sugerir Ítems
                        </>
                    )}
                </button>
            </div>
            <span className={`text-sm font-semibold px-2 py-1 rounded-md ${totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Total: {totalWeight}%
            </span>
        </div>
        {formData.evaluationItems.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder={`Ítem ${index + 1} (Ej: Coherencia)`}
              className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="relative w-32">
                <input
                type="text"
                value={item.weight}
                onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                placeholder="Peso"
                className="w-full pl-3 pr-6 py-2 bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">%</span>
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
              aria-label="Eliminar ítem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          + Añadir Ítem
        </button>
      </div>

       <TextAreaField
            id="criteria"
            label="Criterios de Evaluación"
            value={formData.criteria}
            onChange={handleInputChange}
            placeholder="Escribe cada criterio en una nueva línea o cárgalos con el botón."
            rows={5}
        >
            <button
                type="button"
                onClick={onFetchCriteria}
                disabled={!formData.subject || !formData.grade || isFetchingCriteria || isLoading || isSuggestingCompetencies || isSuggestingItems}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                {isFetchingCriteria ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cargando...
                    </>
                ) : 'Cargar Criterios del Currículo'}
            </button>
        </TextAreaField>
      
      <hr className="border-gray-200" />
      
      {/* Competencias Clave */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <label className="block text-base font-medium text-gray-900">Competencias Clave (LOMLOE)</label>
            <button
                type="button"
                onClick={onSuggestCompetencies}
                disabled={!formData.subject || !formData.topic || isSuggestingCompetencies || isLoading || isFetchingCriteria || isSuggestingItems}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                {isSuggestingCompetencies ? (
                     <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sugiriendo...
                    </>
                ) : 'Sugerir Competencias'}
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-2">
          {keyCompetencies.map(comp => (
            <div key={comp} className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={comp}
                  name="competencies"
                  type="checkbox"
                  checked={formData.competencies.includes(comp)}
                  onChange={() => handleCompetencyChange(comp)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={comp} className="font-normal text-gray-700 cursor-pointer">{comp}</label>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <hr className="border-gray-200" />

      {/* Niveles de Desempeño */}
      <div className="space-y-4">
        <label className="block text-base font-medium text-gray-900">Niveles de Desempeño</label>
        {formData.levels.map((level, index) => (
          <div key={index} className="flex items-center gap-4">
            <input
              type="text"
              value={level.nombre}
              onChange={(e) => handleLevelChange(index, 'nombre', e.target.value)}
              placeholder="Nombre (Ej: Notable)"
              className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              value={level.puntuacion}
              onChange={(e) => handleLevelChange(index, 'puntuacion', e.target.value)}
              placeholder="Puntuación (Ej: 7-8)"
              className="w-40 px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => removeLevel(index)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
              aria-label="Eliminar nivel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLevel}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          + Añadir Nivel
        </button>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading || isFetchingCriteria || isSuggestingCompetencies || isSuggestingItems || totalWeight !== 100}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generando...
            </>
          ) : (
            'Generar Rúbrica'
          )}
        </button>
      </div>
    </form>
  );
};

export default RubricForm;