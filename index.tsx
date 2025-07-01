/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import type { Root } from 'react-dom/client';
import App from './App';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext'; // <-- 1. Importar
// import './assets/css/styles.css'; // Global styles are imported in index.html

// We cast the container to include a custom property to hold the root.
const container = document.getElementById('root') as HTMLElement & { _reactRoot?: Root };

if (container) {
  // Check if the root has already been created.
  // This prevents the warning during development with HMR.
  if (!container._reactRoot) {
    container._reactRoot = ReactDOM.createRoot(container);
  }

  // Now we can safely render or update the component.
  container._reactRoot.render(
      <React.StrictMode>
          <FeatureFlagProvider>
            <App />
          </FeatureFlagProvider>
      </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element. Make sure an element with id="root" exists in your index.html.');
}