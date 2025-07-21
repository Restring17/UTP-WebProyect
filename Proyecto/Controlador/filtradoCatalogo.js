let productosConImagenesGlobal = [];

async function cargarProductos() {
    productosConImagenesGlobal = await getProductos();
    renderizarProductos(productosConImagenesGlobal);
}

function renderizarProductos(productos) {
    const grid = document.getElementById('products_grid');
    grid.innerHTML = "";
    productos.forEach(({ producto, imagenes }) => {
        const imgSrc = (imagenes && imagenes.length > 0) ? imagenes[0].url_completa : "../img/no-image.png";
        const card = document.createElement('div');
        card.className = "product-card";
        card.innerHTML = `
            <a href="#" class="product-link">
                <div>
                    <div class="product_visual">
                        <img class="product_image" src="${imgSrc}" alt="${producto.nombre}">
                    </div>
                    <div class="product_info">
                        <h3 class="product_tittle">${producto.nombre}</h3>
                        <div class="product_classification"></div>
                        <h3 class="product_price">S/${producto.precio}</h3>
                    </div>
                </div>
            </a>
        `;
        // Evento para redirigir al producto
        card.querySelector('.product-link').addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = `/Modelo/Producto.html?id=${producto.id}`;
        });
        grid.appendChild(card);
    });
}

function filtrarProductos({ marca = null, tipo = null }) {
    let filtrados = productosConImagenesGlobal;
    if (marca) {
        filtrados = filtrados.filter(({ producto }) =>
            producto.marca && producto.marca.toLowerCase() === marca.toLowerCase()
        );
    }
    if (tipo) {
        filtrados = filtrados.filter(({ producto }) =>
            producto.tipo && producto.tipo.toLowerCase() === tipo.toLowerCase()
        );
    }
    renderizarProductos(filtrados);
}

document.addEventListener('DOMContentLoaded', async () => {
    await cargarProductos();

    // Filtro por marca
    document.querySelectorAll('.button_marca').forEach(btn => {
        btn.addEventListener('click', function() {
            filtrarProductos({ marca: this.textContent.trim() });
        });
    });

    // Filtro por tipo
    document.querySelectorAll('.button_type').forEach(btn => {
        btn.addEventListener('click', function() {
            filtrarProductos({ tipo: this.textContent.trim() });
        });
    });

    // Puedes agregar más filtros aquí...

    document.getElementById('btn-reset-filtros').addEventListener('click', function() {
    renderizarProductos(productosConImagenesGlobal);
});
});
