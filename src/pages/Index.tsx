
import { useState } from "react";
import { Header } from "@/components/Header";
import { ContractTypeSelector } from "@/components/ContractTypeSelector";
import { ContractForm } from "@/components/ContractForm";
import { ContractPreview } from "@/components/ContractPreview";
import { ApiKeyRequired } from "@/components/ApiKeyRequired";
import { useApiKey } from "@/context/ApiKeyContext";
import { ContractType } from "@/types";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const { isApiKeySet } = useApiKey();
  const [selectedType, setSelectedType] = useState<ContractType | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  
  const handleTypeSelect = (type: ContractType) => {
    setSelectedType(type);
    setGeneratedContent(null);
  };
  
  const handleBack = () => {
    setSelectedType(null);
    setGeneratedContent(null);
  };
  
  const handleFormBack = () => {
    setGeneratedContent(null);
  };
  
  const handleGenerated = (content: string) => {
    setGeneratedContent(content);
  };
  
  const renderContent = () => {
    if (!isApiKeySet) {
      return <ApiKeyRequired />;
    }
    
    if (generatedContent) {
      return (
        <ContractPreview 
          content={generatedContent} 
          onBack={handleFormBack}
          onEdit={setGeneratedContent}
        />
      );
    }
    
    if (selectedType) {
      return (
        <ContractForm 
          type={selectedType} 
          onBack={handleBack}
          onGenerated={handleGenerated}
        />
      );
    }
    
    return (
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <h1 className="text-4xl font-bold text-legal-navy mb-4">Indonesian Legal Contract AI</h1>
          <p className="text-lg text-gray-600 mb-8">
            Generate professional legal contracts compliant with Indonesian regulations.
            Select a contract type below to get started.
          </p>
        </div>
        
        <ContractTypeSelector onSelect={handleTypeSelect} />
        
        <div className="mt-16 mb-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-legal-navy mb-4">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border border-legal-gray">
              <h3 className="font-medium mb-2 text-legal-navy">1. Select Contract Type</h3>
              <p className="text-sm text-gray-600">Choose from various contract templates designed for Indonesian legal requirements.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-legal-gray">
              <h3 className="font-medium mb-2 text-legal-navy">2. Fill Contract Details</h3>
              <p className="text-sm text-gray-600">Provide the specific information needed to customize your contract.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-legal-gray">
              <h3 className="font-medium mb-2 text-legal-navy">3. Review & Download</h3>
              <p className="text-sm text-gray-600">Get AI-powered contract review and download your completed document.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-legal-light">
      <Header />
      <main className="pb-16">
        {renderContent()}
      </main>
      <Toaster />
    </div>
  );
};

export default Index;
