
export type ContractType = 
  | "commercial" 
  | "partnership" 
  | "employment" 
  | "nda" 
  | "vendor";

export interface ContractTemplate {
  id: ContractType;
  name: string;
  description: string;
  icon: string;
  fields: FieldData[];
  sample: string;
}

export interface FieldData {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "date";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  helpText?: string;
  defaultValue?: string;
}

export interface ApiKeyFormData {
  apiKey: string;
}

export interface ContractFormData {
  [key: string]: string;
}

export interface ReviewResult {
  suggestions: string[];
  risks: string[];
  completeness: number;
  revisedContent?: string;
}
