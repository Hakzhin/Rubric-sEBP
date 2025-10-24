export interface LevelDefinition {
  nombre: string;
  puntuacion: string;
}

export interface Level {
  nombre: string;
  descripcion: string;
}

export interface EvaluationItem {
  item: string;
  peso: string;
  criteriosAsociados: string[];
  competenciasAsociadas: string[];
  niveles: Level[];
}

export interface RubricData {
  rubrica: EvaluationItem[];
}

export interface EvaluationItemConfig {
  name: string;
  weight: string;
}

export interface FormData {
  stage: string;
  subject: string;
  grade: string;
  topic: string;
  criteria: string;
  levels: LevelDefinition[];
  competencies: string[];
  evaluationItems: EvaluationItemConfig[];
}