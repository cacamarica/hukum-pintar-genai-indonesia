
import { ContractTemplate } from "@/types";

export const contractTemplates: ContractTemplate[] = [
  {
    id: "commercial",
    name: "Commercial Agreement",
    description: "Standard agreement for commercial transactions between businesses",
    icon: "contract",
    fields: [
      { id: "partyA", label: "First Party Name", type: "text", required: true },
      { id: "partyARole", label: "First Party Role", type: "select", options: ["Company", "CV", "Individual"], required: true },
      { id: "partyAAddress", label: "First Party Address", type: "textarea", required: true },
      { id: "partyARepresentative", label: "First Party Representative", type: "text", required: true },
      { id: "partyB", label: "Second Party Name", type: "text", required: true },
      { id: "partyBRole", label: "Second Party Role", type: "select", options: ["Company", "CV", "Individual"], required: true },
      { id: "partyBAddress", label: "Second Party Address", type: "textarea", required: true },
      { id: "partyBRepresentative", label: "Second Party Representative", type: "text", required: true },
      { id: "contractTerm", label: "Contract Term (months)", type: "text", required: true },
      { id: "contractValue", label: "Contract Value (IDR)", type: "text", required: true },
      { id: "serviceDescription", label: "Service Description", type: "textarea", required: true },
      { id: "paymentTerms", label: "Payment Terms", type: "textarea", required: true }
    ],
    sample: "COMMERCIAL AGREEMENT\n\nThis Commercial Agreement (\"Agreement\") is made and entered into on [date], by and between:\n\n[First Party Name], a [First Party Role] established under the laws of the Republic of Indonesia, having its registered address at [First Party Address], represented by [First Party Representative] (hereinafter referred to as \"First Party\");\n\nand\n\n[Second Party Name], a [Second Party Role] established under the laws of the Republic of Indonesia, having its registered address at [Second Party Address], represented by [Second Party Representative] (hereinafter referred to as \"Second Party\").\n\nBoth parties agree to the following terms and conditions..."
  },
  {
    id: "partnership",
    name: "Partnership Agreement",
    description: "Agreement to establish business partnerships in accordance with Indonesian law",
    icon: "file-pen",
    fields: [
      { id: "partnerA", label: "Partner A Name", type: "text", required: true },
      { id: "partnerARole", label: "Partner A Role", type: "select", options: ["Company", "CV", "Individual"], required: true },
      { id: "partnerAAddress", label: "Partner A Address", type: "textarea", required: true },
      { id: "partnerARepresentative", label: "Partner A Representative", type: "text", required: true },
      { id: "partnerB", label: "Partner B Name", type: "text", required: true },
      { id: "partnerBRole", label: "Partner B Role", type: "select", options: ["Company", "CV", "Individual"], required: true },
      { id: "partnerBAddress", label: "Partner B Address", type: "textarea", required: true },
      { id: "partnerBRepresentative", label: "Partner B Representative", type: "text", required: true },
      { id: "partnershipPurpose", label: "Partnership Purpose", type: "textarea", required: true },
      { id: "profitSharing", label: "Profit Sharing Terms", type: "textarea", required: true },
      { id: "partnershipTerm", label: "Partnership Term (years)", type: "text", required: true }
    ],
    sample: "PARTNERSHIP AGREEMENT\n\nThis Partnership Agreement (\"Agreement\") is made and entered into on [date], by and between:\n\n[Partner A Name], a [Partner A Role] established under the laws of the Republic of Indonesia, having its registered address at [Partner A Address], represented by [Partner A Representative] (hereinafter referred to as \"Partner A\");\n\nand\n\n[Partner B Name], a [Partner B Role] established under the laws of the Republic of Indonesia, having its registered address at [Partner B Address], represented by [Partner B Representative] (hereinafter referred to as \"Partner B\").\n\nWHEREAS, the Parties wish to enter into a partnership for the purpose of [Partnership Purpose];\n\nNOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, the Parties agree as follows..."
  },
  {
    id: "employment",
    name: "Employment Contract",
    description: "Standard employment agreement compliant with Indonesian labor law",
    icon: "file-text",
    fields: [
      { id: "employerName", label: "Employer Name", type: "text", required: true },
      { id: "employerRole", label: "Employer Type", type: "select", options: ["Company", "CV", "Individual"], required: true },
      { id: "employerAddress", label: "Employer Address", type: "textarea", required: true },
      { id: "employerRepresentative", label: "Employer Representative", type: "text", required: true },
      { id: "employeeName", label: "Employee Name", type: "text", required: true },
      { id: "employeeNIK", label: "Employee NIK (ID Number)", type: "text", required: true },
      { id: "employeeAddress", label: "Employee Address", type: "textarea", required: true },
      { id: "position", label: "Position/Role", type: "text", required: true },
      { id: "employmentType", label: "Employment Type", type: "select", options: ["Permanent", "Contract (PKWT)", "Probation"], required: true },
      { id: "startDate", label: "Start Date", type: "date", required: true },
      { id: "salary", label: "Monthly Salary (IDR)", type: "text", required: true },
      { id: "workingHours", label: "Working Hours", type: "text", required: true }
    ],
    sample: "EMPLOYMENT CONTRACT\n\nThis Employment Contract (\"Contract\") is made and entered into on [date], by and between:\n\n[Employer Name], a [Employer Type] established under the laws of the Republic of Indonesia, having its registered address at [Employer Address], represented by [Employer Representative] (hereinafter referred to as the \"Employer\");\n\nand\n\n[Employee Name], an Indonesian citizen with ID Number (NIK) [Employee NIK], residing at [Employee Address] (hereinafter referred to as the \"Employee\").\n\nThe Employer and the Employee shall collectively be referred to as the \"Parties\" and individually as a \"Party\"."
  },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    description: "Agreement to protect confidential information",
    icon: "file",
    fields: [
      { id: "disclosingParty", label: "Disclosing Party Name", type: "text", required: true },
      { id: "disclosingPartyRole", label: "Disclosing Party Type", type: "select", options: ["Company", "CV", "Individual"], required: true },
      { id: "disclosingPartyAddress", label: "Disclosing Party Address", type: "textarea", required: true },
      { id: "disclosingPartyRepresentative", label: "Disclosing Party Representative", type: "text", required: true },
      { id: "receivingParty", label: "Receiving Party Name", type: "text", required: true },
      { id: "receivingPartyRole", label: "Receiving Party Type", type: "select", options: ["Company", "CV", "Individual"], required: true },
      { id: "receivingPartyAddress", label: "Receiving Party Address", type: "textarea", required: true },
      { id: "receivingPartyRepresentative", label: "Receiving Party Representative", type: "text", required: true },
      { id: "purpose", label: "Purpose of Disclosure", type: "textarea", required: true },
      { id: "effectiveDate", label: "Effective Date", type: "date", required: true },
      { id: "term", label: "Term (years)", type: "text", required: true }
    ],
    sample: "NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement (\"Agreement\") is made and entered into on [date], by and between:\n\n[Disclosing Party Name], a [Disclosing Party Type] established under the laws of the Republic of Indonesia, having its registered address at [Disclosing Party Address], represented by [Disclosing Party Representative] (hereinafter referred to as the \"Disclosing Party\");\n\nand\n\n[Receiving Party Name], a [Receiving Party Type] established under the laws of the Republic of Indonesia, having its registered address at [Receiving Party Address], represented by [Receiving Party Representative] (hereinafter referred to as the \"Receiving Party\").\n\nWHEREAS, the Disclosing Party possesses certain confidential and proprietary information relating to its business, which may be disclosed to the Receiving Party for the purpose of [Purpose of Disclosure];"
  },
  {
    id: "vendor",
    name: "Vendor Agreement",
    description: "Agreement for vendor and supplier relationships",
    icon: "clipboard",
    fields: [
      { id: "clientName", label: "Client Name", type: "text", required: true },
      { id: "clientRole", label: "Client Type", type: "select", options: ["Company", "CV", "Individual"], required: true },
      { id: "clientAddress", label: "Client Address", type: "textarea", required: true },
      { id: "clientRepresentative", label: "Client Representative", type: "text", required: true },
      { id: "vendorName", label: "Vendor Name", type: "text", required: true },
      { id: "vendorRole", label: "Vendor Type", type: "select", options: ["Company", "CV", "Individual"], required: true },
      { id: "vendorAddress", label: "Vendor Address", type: "textarea", required: true },
      { id: "vendorRepresentative", label: "Vendor Representative", type: "text", required: true },
      { id: "services", label: "Services/Products", type: "textarea", required: true },
      { id: "deliveryTerms", label: "Delivery Terms", type: "textarea", required: true },
      { id: "paymentTerms", label: "Payment Terms", type: "textarea", required: true },
      { id: "contractTerm", label: "Contract Term (months)", type: "text", required: true }
    ],
    sample: "VENDOR AGREEMENT\n\nThis Vendor Agreement (\"Agreement\") is made and entered into on [date], by and between:\n\n[Client Name], a [Client Type] established under the laws of the Republic of Indonesia, having its registered address at [Client Address], represented by [Client Representative] (hereinafter referred to as the \"Client\");\n\nand\n\n[Vendor Name], a [Vendor Type] established under the laws of the Republic of Indonesia, having its registered address at [Vendor Address], represented by [Vendor Representative] (hereinafter referred to as the \"Vendor\").\n\nWHEREAS, the Client desires to engage the Vendor to provide certain services or products as described herein; and\n\nWHEREAS, the Vendor is willing to provide such services or products according to the terms and conditions of this Agreement."
  }
];
