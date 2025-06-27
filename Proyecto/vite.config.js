import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'Modelo/Home.html'),
        catalogo: resolve(__dirname, 'Modelo/Catalogo.html'),
        contacto: resolve(__dirname, 'Modelo/Contacto.html'),
        marcas: resolve(__dirname, 'Modelo/Marcas.html'),
        noticias: resolve(__dirname, 'Modelo/Noticias.html'),
        producto: resolve(__dirname, 'Modelo/Producto.html'),
        reguistro: resolve(__dirname, 'Modelo/Reguistro.html'),
      },
    },
  },
});
