import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, Container } from '@chakra-ui/react';
import App from './pages/App';
import './axiosSetup';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <Container maxW="6xl" py={4}>
        <App />
      </Container>
    </ChakraProvider>
  </React.StrictMode>,
);
