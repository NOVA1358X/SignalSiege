import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import App from './App';
import './index.css';

// @ts-expect-error Vite env types
const DYNAMIC_ENVIRONMENT_ID = import.meta.env?.VITE_DYNAMIC_ENVIRONMENT_ID || 'd6b08b9e-ea9c-4c6b-b937-0b4913d3e390';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DynamicContextProvider>
  </React.StrictMode>
);
