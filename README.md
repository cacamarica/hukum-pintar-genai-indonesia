# Hukum Pintar GenAI Indonesia

An AI-powered legal document generator for Indonesian contracts using OpenAI and Supabase.

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Project Setup](#project-setup)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Setup](#environment-setup)
5. [Architecture](#architecture)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [Database](#database)
6. [API Integration](#api-integration)
7. [Deployment](#deployment)
8. [Development](#development)
   - [Local Development](#local-development)
   - [Building for Production](#building-for-production)
9. [Component Documentation](#component-documentation)
10. [Services Documentation](#services-documentation)

## Overview

Hukum Pintar GenAI Indonesia is a web application designed to help users generate legal contracts tailored to Indonesian law. The application leverages OpenAI's GPT models to create professionally formatted contracts based on user inputs. Users can select from multiple contract types, fill in specific details, and receive an AI-generated contract that complies with Indonesian legal standards.

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn UI (based on Radix UI)
- **Styling**: TailwindCSS
- **State Management**: React Hooks + React Context
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query)

### Backend
- **Supabase**: Database, Authentication, Edge Functions
- **Local Server**: Express.js (for development)
- **API**: OpenAI API integration

### Tools & Utilities
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Package Manager**: Bun (compatible with npm/yarn commands)
- **Development Mode Component Tagging**: Lovable Tagger

## Features

- Multiple contract templates (Commercial, Partnership, Employment, NDA, Vendor)
- Dynamic form generation based on contract type
- AI-powered contract generation using OpenAI GPT models
- Interactive chat interface for revising contracts
- Contract preview with syntax highlighting
- Download contracts as TXT, DOCX, or PDF
- Contract validation and reviewing
- Connection status monitoring for local server and Supabase
- API key management for OpenAI integration

## Project Setup

### Prerequisites

- Node.js (v16+)
- Bun, npm, or yarn package manager
- OpenAI API key
- Supabase account and project (or use local development mode)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hukum-pintar-genai-indonesia
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Set up environment variables by creating a `.env` file in the project root:
```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API Key (optional for local dev - can also be set in the UI)
OPENAI_API_KEY=your_openai_api_key

# Local Server Configuration
LOCAL_SERVER_URL=http://localhost:54321
USE_LOCAL_SERVER=true
```

### Environment Setup

#### Supabase Setup
1. Create a new Supabase project
2. Create the following tables in your Supabase database:
   
   **api_keys table**:
   ```sql
   CREATE TABLE api_keys (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL,
     openai_key TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
   
   **contracts table**:
   ```sql
   CREATE TABLE contracts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL,
     title TEXT NOT NULL,
     contract_type TEXT NOT NULL,
     content TEXT NOT NULL,
     form_data JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. Deploy the Supabase Edge Function for contract generation (if using Supabase backend)

## Architecture

### Frontend

The application is built with React and TypeScript using a component-based architecture:

- **Pages**: Main application views (`Index.tsx`, `NotFound.tsx`)
- **Components**: Reusable UI components separated by functionality
  - UI components (Shadcn UI)
  - Business logic components (ContractForm, ContractChat, etc.)
- **Context**: React Context for state management (`ApiKeyContext`)
- **Services**: Abstracted API communication (`aiService.ts`)
- **Types**: TypeScript type definitions
- **Config**: Application configuration (`contractTemplates.ts`)

### Backend

Two backend options are available:

1. **Local Express Server** (`local-server/server.js`):
   - Mock implementation of Supabase Edge Functions
   - Direct integration with OpenAI API
   - Used for local development without Supabase dependency

2. **Supabase Edge Functions** (`supabase/functions/generate-contract/`):
   - Serverless function for contract generation
   - Integration with Supabase database
   - User authentication and API key management

### Database

Supabase PostgreSQL database with the following tables:

1. **api_keys**:
   - Stores user's OpenAI API keys
   - Fields: id, user_id, openai_key, created_at, updated_at

2. **contracts**:
   - Stores generated contracts
   - Fields: id, user_id, title, contract_type, content, form_data, created_at, updated_at

## API Integration

The application integrates with OpenAI's GPT models (gpt-4o) through the AIService class:

- **generateContract**: Creates new contracts based on user input and template
- **reviseContract**: Updates existing contracts based on user instructions
- **reviewContract**: Analyzes contracts for legal issues, risks, and completeness

## Deployment

### Building for Production

1. Build the frontend:
```bash
npm run build
```

2. The build output will be in the `dist` directory, which can be deployed to any static hosting service.

3. Deploy Supabase Edge Functions (if using Supabase backend):
```bash
supabase functions deploy generate-contract
```

## Development

### Local Development

1. Start the development server:
```bash
npm run dev
```

2. Start the local Express server (for development without Supabase):
```bash
npm run server
```

3. Access the application at `http://localhost:8080`

## Component Documentation

### Key Components

#### ContractTypeSelector
Allows users to select from available contract types.

#### ContractForm
Dynamically generates form fields based on the selected contract type.

#### ContractPreview
Displays the generated contract with syntax highlighting and download options.

#### ContractChat
Provides an interactive chat interface for revising and improving contracts.

#### ConnectionStatus
Monitors and displays the connection status of local server and Supabase.

#### ApiKeyTester
Tests the validity of the OpenAI API key.

## Services Documentation

### AIService

The `AIService` class handles all AI-related functionality:

- **setApiKey(key)**: Sets the OpenAI API key in local storage and Supabase
- **getApiKey()**: Retrieves the stored API key
- **clearApiKey()**: Removes the API key
- **checkApiKey()**: Validates the API key with OpenAI
- **generateContract(contractType, formData, template)**: Generates a contract
- **reviewContract(contractText)**: Reviews a contract for legal issues
- **reviseContract(currentContract, userInstructions, contractType)**: Updates a contract based on instructions

The class implements fallback mechanisms to use either Supabase Edge Functions or the local Express server for contract generation.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All Rights Reserved

This software is the property of Rudy Hartono. All rights are reserved. No part of this software may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of Rudy Hartono.

## Contact

Rudy Hartono - rudysetyohartono@gmail.com

Project Link: [https://github.com/yourusername/hukum-pintar-genai-indonesia](https://github.com/yourusername/hukum-pintar-genai-indonesia)

## Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.io/)
- [OpenAI](https://openai.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
