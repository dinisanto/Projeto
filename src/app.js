const axios = require('axios');

// URL base do servidor que está rodando o `connect.js`
const BASE_URL = 'http://localhost:5500';

// Função para buscar o filme
async function getFilm(title) {
    try {
        // Faz uma requisição ao endpoint do `connect.js`
        const response = await axios.get(`${BASE_URL}/get_film/${encodeURIComponent(title)}`);
        
        // Exibe os dados do filme retornados pelo servidor
        console.log("Filme encontrado:");
        console.log(`Título: ${response.data.title}`);
        console.log(`Resumo: ${response.data.plot}`);
        console.log(`Trailer: ${response.data.trailer}`);
        console.log(`Imagem: ${response.data.image}`);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log("Filme não encontrado.");
        } else {
            console.error("Erro ao buscar o filme:", error.message);
        }
    }
}

// Testar a função com um filme
const movieTitle = "Inception"; // Substitua pelo nome do filme desejado
getFilm(movieTitle);
