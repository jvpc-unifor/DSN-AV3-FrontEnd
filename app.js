const productList = document.querySelector('#products');
const addProductForm = document.querySelector('#add-product-form');
const updateProductForm = document.querySelector('#update-product-form'); // Garanta que este formulário exista no HTML
const updateProductId = document.querySelector('#update-id'); // Campo hidden no updateProductForm
const updateProductName = document.querySelector('#update-name'); // Campo de nome no updateProductForm
const updateProductDescription = document.querySelector('#update-description'); // Campo de descrição no updateProductForm
const updateProductPrice = document.querySelector('#update-price'); // Campo de preço no updateProductForm
const cancelUpdateButton = document.querySelector('#cancel-update-button'); // Botão para cancelar a atualização

const searchProductIdInput = document.querySelector('#search-product-id');
const searchProductButton = document.querySelector('#search-product-button');
const productDetailsContainer = document.querySelector('#product-details-container');
const noProductsMessage = document.querySelector('#no-products-message'); // Para a mensagem de "Nenhum produto"

// Function to fetch all products from the server
async function fetchProducts() {
  try {
    const response = await fetch('http://localhost:3000/products');
    if (!response.ok) {
      console.error("Erro ao buscar produtos:", response.status, response.statusText);
      if (noProductsMessage) {
        noProductsMessage.textContent = 'Falha ao carregar produtos.';
        noProductsMessage.style.display = 'block';
      }
      productList.innerHTML = ''; // Limpa a lista em caso de erro também
      return;
    }
    const products = await response.json();

    // Clear product list
    productList.innerHTML = '';

    if (products && products.length > 0) {
      if (noProductsMessage) noProductsMessage.style.display = 'none'; // Esconde a mensagem se houver produtos

      // Add each product to the list
      products.forEach(product => {
        const li = document.createElement('li');
        // Aplicando classes Tailwind para o novo visual do item da lista
        li.className = 'flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300';

        // Div para informações do produto
        const productInfoDiv = document.createElement('div');
        productInfoDiv.className = 'mb-3 sm:mb-0 flex-grow'; // flex-grow para ocupar espaço disponível

        const productNameH3 = document.createElement('h3');
        productNameH3.className = 'text-xl font-semibold text-sky-700';
        productNameH3.textContent = product.name;
        productInfoDiv.appendChild(productNameH3);

        const productDescriptionP = document.createElement('p');
        productDescriptionP.className = 'text-sm text-slate-600 mt-1';
        productDescriptionP.textContent = product.description || 'Sem descrição detalhada.';
        productInfoDiv.appendChild(productDescriptionP);

        const productPriceP = document.createElement('p');
        productPriceP.className = 'text-md font-bold text-emerald-600 mt-1';
        productPriceP.textContent = `$${parseFloat(product.price).toFixed(2)}`;
        productInfoDiv.appendChild(productPriceP);

        li.appendChild(productInfoDiv);

        // Div para os botões de ação
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex space-x-2 self-start sm:self-center'; // Garante alinhamento

        // Add update button for each product
        const updateButton = document.createElement('button');
        updateButton.innerHTML = 'Update';
        updateButton.className = 'bg-amber-400 hover:bg-amber-500 text-white font-medium py-2 px-3 rounded-md shadow hover:shadow-md transition-all duration-300 text-xs sm:text-sm';
        updateButton.addEventListener('click', () => {
          if (updateProductId) updateProductId.value = product.id;
          if (updateProductName) updateProductName.value = product.name;
          if (updateProductDescription) updateProductDescription.value = product.description || '';
          if (updateProductPrice) updateProductPrice.value = product.price;

          if (updateProductForm) updateProductForm.style.display = 'block';
          if (addProductForm) addProductForm.style.display = 'none'; // Esconde o form de adicionar
          if (productDetailsContainer) productDetailsContainer.innerHTML = ''; // Limpa detalhes da busca por ID
          if (updateProductName) updateProductName.focus();
        });
        actionsDiv.appendChild(updateButton);
        
        // Add delete button for each product
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'Delete';
        deleteButton.className = 'bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-md shadow hover:shadow-md transition-all duration-300 text-xs sm:text-sm';
        deleteButton.addEventListener('click', async () => {
          // Adicionar uma confirmação antes de deletar
          if (confirm(`Tem certeza que deseja deletar o produto "${product.name}"?`)) {
            const success = await deleteProduct(product.id);
            if (success) {
              await fetchProducts(); 
            }
          }
        });
        actionsDiv.appendChild(deleteButton);

        li.appendChild(actionsDiv);
        productList.appendChild(li);
      });
    } else {
      // Mostra a mensagem se não houver produtos
      if (noProductsMessage) {
        noProductsMessage.textContent = 'Nenhum produto cadastrado ainda.';
        noProductsMessage.style.display = 'block';
      }
    }
  } catch (error) {
    console.error("Falha ao buscar produtos (catch):", error);
    if (noProductsMessage) {
        noProductsMessage.textContent = 'Erro ao carregar produtos. Tente novamente mais tarde.';
        noProductsMessage.style.display = 'block';
    }
    productList.innerHTML = ''; // Limpa a lista em caso de erro também
  }
}

// Event listener for Add Product form submit button
if (addProductForm) {
  addProductForm.addEventListener('submit', async event => {
    event.preventDefault();
    const nameInput = addProductForm.elements['name'];
    const descriptionInput = addProductForm.elements['description'];
    const priceInput = addProductForm.elements['price'];

    const name = nameInput.value;
    const description = descriptionInput.value;
    const price = priceInput.value;

    if (!name.trim() || !price.trim()) {
        alert('Nome e Preço são obrigatórios!');
        return;
    }
    if (parseFloat(price) < 0) {
        alert('O preço não pode ser negativo.');
        return;
    }

    const success = await addProduct(name, description, price);

    if (success) {
      addProductForm.reset(); 
      await fetchProducts(); 
      nameInput.focus(); // Foca no campo nome para nova adição
    }
  });
}

// Function to add a new product
async function addProduct(name, description, price) {
  try {
    const response = await fetch('http://localhost:3000/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description, price: parseFloat(price) })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido do servidor.' }));
      const errorMessage = errorData.message || response.statusText;
      console.error('Erro ao adicionar produto no servidor:', response.status, errorMessage);
      alert(`Falha ao adicionar produto: ${errorMessage}`);
      return false;
    }
    return true; 
  } catch (error) {
    console.error('Erro de comunicação ao adicionar produto:', error);
    alert('Erro de comunicação com o servidor ao tentar adicionar. Verifique o console.');
    return false;
  }
}

// Function to delete a product
async function deleteProduct(id) {
  try {
    const response = await fetch('http://localhost:3000/products/' + id, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido do servidor.' }));
        const errorMessage = errorData.message || response.statusText;
        console.error('Erro ao deletar produto no servidor:', response.status, errorMessage);
        alert(`Falha ao deletar produto: ${errorMessage}`);
        return false;
    }
    return true; 
  } catch(error) {
    console.error('Erro de comunicação ao deletar produto:', error);
    alert('Erro de comunicação com o servidor ao tentar deletar. Verifique o console.');
    return false;
  }
}

// Event listener for Cancel Update button
if (cancelUpdateButton) {
  cancelUpdateButton.addEventListener('click', () => {
    if (updateProductForm) {
      updateProductForm.style.display = 'none'; 
      updateProductForm.reset(); 
    }
    if (addProductForm) addProductForm.style.display = 'block'; 
    if (productDetailsContainer) productDetailsContainer.innerHTML = '<p class="text-slate-500 italic text-center">Detalhes do produto aparecerão aqui após a busca.</p>'; // Limpa busca por ID
  });
}

// Event listener for Update Product form submit button
if (updateProductForm) {
  updateProductForm.addEventListener('submit', async event => {
    event.preventDefault();
    const id = updateProductId.value;
    const name = updateProductName.value;
    const description = updateProductDescription.value;
    const price = updateProductPrice.value;

    if (!id) {
      alert('Erro: ID do produto não selecionado para atualização.');
      return;
    }
    if (!name.trim() || !price.trim()) {
        alert('Nome e Preço são obrigatórios para atualização!');
        return;
    }
     if (parseFloat(price) < 0) {
        alert('O preço não pode ser negativo.');
        return;
    }

    const success = await updateProductOnServer(id, { name, description, price: parseFloat(price) });

    if (success) {
      updateProductForm.style.display = 'none';
      updateProductForm.reset();
      if (addProductForm) addProductForm.style.display = 'block';
      if (productDetailsContainer) productDetailsContainer.innerHTML = '<p class="text-slate-500 italic text-center">Detalhes do produto aparecerão aqui após a busca.</p>'; // Limpa busca por ID
      await fetchProducts();
    }
  });
}

// Function to update a product on the server
async function updateProductOnServer(id, productData) {
  try {
    const response = await fetch(`http://localhost:3000/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({ message: 'Erro desconhecido do servidor.' }));
      const errorMessage = errorResult.message || response.statusText;
      console.error('Erro ao atualizar produto no servidor:', response.status, errorMessage);
      alert(`Falha ao atualizar produto: ${errorMessage}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erro de comunicação ao atualizar produto:', error);
    alert('Erro de comunicação com o servidor. Verifique o console.');
    return false;
  }
}

// Event listener for Search Product button
if (searchProductButton) {
    searchProductButton.addEventListener('click', async () => {
        const productIdValue = searchProductIdInput.value; 
        if (!productIdValue.trim()) { 
            alert('Por favor, digite um ID para buscar.');
            if(productDetailsContainer) productDetailsContainer.innerHTML = '<p class="text-slate-500 italic text-center">Detalhes do produto aparecerão aqui após a busca.</p>';
            return;
        }
        if (updateProductForm) updateProductForm.style.display = 'none'; // Esconde form de update se estiver aberto
        if (addProductForm) addProductForm.style.display = 'block'; // Garante que form de add esteja visível
        await fetchProductById(productIdValue);
    });
}

// Function to fetch a single product by ID from the server
async function fetchProductById(id) {
    if (!productDetailsContainer) return; 

    try {
        productDetailsContainer.innerHTML = '<p class="text-slate-500 italic text-center">Buscando...</p>';

        const response = await fetch(`http://localhost:3000/products/${id}`);
        
        if (!response.ok) {
            productDetailsContainer.innerHTML = `<p class="text-red-500 text-center">Erro ao buscar produto (ID: ${id}): ${response.status} - ${response.statusText}</p>`;
            console.error('Erro na resposta do servidor ao buscar por ID:', response);
            return;
        }

        const productsArray = await response.json();

        if (productsArray && productsArray.length > 0) {
            const product = productsArray[0];
            productDetailsContainer.innerHTML = `
                <h3 class="text-lg font-semibold text-slate-700 mb-2">Detalhes do Produto ID: ${product.id}</h3>
                <p><strong class="font-medium text-slate-600">Nome:</strong> <span class="text-slate-800">${product.name}</span></p>
                <p><strong class="font-medium text-slate-600">Descrição:</strong> <span class="text-slate-800">${product.description || 'Não informada'}</span></p>
                <p><strong class="font-medium text-slate-600">Preço:</strong> <span class="text-emerald-600 font-semibold">$${parseFloat(product.price).toFixed(2)}</span></p>
            `;
        } else {
            productDetailsContainer.innerHTML = `<p class="text-amber-600 text-center">Produto com ID ${id} não encontrado.</p>`;
        }

    } catch (error) {
        productDetailsContainer.innerHTML = '<p class="text-red-500 text-center">Falha na comunicação ao buscar o produto. Verifique o console.</p>';
        console.error('Erro ao buscar produto por ID:', error);
    }
}

// Fetch all products on page load
// Adicionando um listener para garantir que o DOM esteja pronto, embora 'defer' no script tag seja o ideal
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    // Define o placeholder inicial para a busca por ID
    if(productDetailsContainer) {
        productDetailsContainer.innerHTML = '<p class="text-slate-500 italic text-center">Detalhes do produto aparecerão aqui após a busca.</p>';
    }
});
