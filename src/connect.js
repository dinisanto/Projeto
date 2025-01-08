require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const supabase = require('./config/supabaseClient.js'); // Importando a conexão com o Supabase

const app = express();
app.use(cors());
app.use(express.json()); // Permite processar JSON no corpo da requisição

// Credenciais da API TMDb
const TMDB_ACCESS_TOKEN = "3e77b0edc4a3f1ba70dba05d0c1423ab";
const OMDB_API_KEY = "3adb50b9";

// Função para formatar datas no formato YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString || dateString === "N/A") return null;
    const date = new Date(dateString);
    if (isNaN(date)) return null; // Verifica se a data é inválida
    return date.toISOString().split('T')[0]; // Retorna apenas a parte da data (YYYY-MM-DD)
}

// Função para buscar trailer diretamente na TMDb API
async function getTmdbTrailer(movieId) {
    const tmdbTrailerUrl = `https://api.themoviedb.org/3/movie/${movieId}/videos`;
    try {
        // Chamada para a TMDb API para buscar vídeos (trailers)
        const response = await axios.get(tmdbTrailerUrl, {
            params: {
                api_key: TMDB_ACCESS_TOKEN,
                language: "pt-BR", // Ou outro idioma desejado
            },
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Log detalhado da resposta
        console.log('Resposta de vídeos da TMDb:', response.data);

        const videos = response.data.results;
        if (videos && videos.length > 0) {
            // Primeiro tentar encontrar trailers
            const trailer = videos.find(video => video.type === "Trailer");
            if (trailer) {
                return `https://www.youtube.com/watch?v=${trailer.key}`;
            }

            // Se não encontrar trailer, procurar teasers ou outros vídeos
            const otherVideo = videos.find(video => video.type === "Teaser" || video.type === "Clip");
            if (otherVideo) {
                return `https://www.youtube.com/watch?v=${otherVideo.key}`;
            }
        }
        return "Trailer não disponível"; // Caso nenhum vídeo relevante seja encontrado
    } catch (error) {
        console.error("Erro ao buscar trailer na TMDb API:", error.response ? error.response.data : error.message);
        return "Erro ao buscar trailer"; // Retorna um erro genérico em caso de falha
    }
}

// Endpoint para buscar o filme e salvar no Supabase
app.get('/get_film/:title', async (req, res) => {
    const { title } = req.params;
    const { exact } = req.query;

    try {
        // 1. Consulta à API TMDb para buscar informações detalhadas do filme
        const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie`;
        console.log('Chamando TMDb API:', tmdbSearchUrl);

        const tmdbResponse = await axios.get(tmdbSearchUrl, {
            params: {
                query: title,
                api_key: TMDB_ACCESS_TOKEN,
                language: "pt-BR",
            },
            headers: {
                "Content-Type": "application/json;charset=utf-8",
            },
        });

        const tmdbData = tmdbResponse.data;

        if (!tmdbData.results || tmdbData.results.length === 0) {
            return res.status(404).json({ error: "Nenhum filme encontrado na TMDb." });
        }

        // 2. Filtrar os filmes, se o parâmetro `exact` estiver presente
        let movies = tmdbData.results;
        if (exact === "true") {
            movies = movies.filter(movie => movie.title.toLowerCase() === title.toLowerCase());
            if (movies.length === 0) {
                return res.status(404).json({ error: "Filme exato não encontrado na TMDb." });
            }
        }

        // 3. Consulta à API OMDb para enriquecer com release_date e vote_average
        const enrichedMovies = await Promise.all(
            movies.map(async (movie) => {
                const tmdbId = movie.id; // ID do filme no TMDb

                // Consulta ao OMDb para obter release_date e vote_average
                const omdbUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(movie.title)}`;
                console.log('Chamando OMDb API:', omdbUrl);

                const omdbResponse = await axios.get(omdbUrl);
                const omdbData = omdbResponse.data;

                const release_date = formatDate(omdbData.Released) || formatDate(movie.release_date);
                const vote_average = omdbData.imdbRating && !isNaN(omdbData.imdbRating) ? parseFloat(omdbData.imdbRating) : movie.vote_average;

                // Definir a imagem (poster), preferindo o TMDb
                const poster = movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : (omdbData.Response !== "False" && omdbData.Poster !== "N/A") ? omdbData.Poster : "Imagem não encontrada";

                // Obter trailer da TMDb API
                const trailerUrl = await getTmdbTrailer(tmdbId);

                // Retornar os dados enriquecidos do filme
                return {
                    title: movie.title,
                    plot: movie.overview || "Sinopse não disponível.",
                    trailer: trailerUrl,
                    image: poster,
                    release_date: release_date,
                    vote_average: vote_average,
                };
            })
        );

        // 5. Salvar os dados no Supabase
        const { error } = await supabase
            .from('filmes')
            .insert(enrichedMovies);

        if (error) {
            console.error('Erro ao salvar no Supabase:', error.message);
            return res.status(500).json({ error: "Erro ao salvar dados no Supabase" });
        }

        // 6. Retornar os filmes para o frontend
        return res.json({
            movies: enrichedMovies,
            message: `${enrichedMovies.length} filme(s) encontrado(s).`,
        });
    } catch (error) {
        console.error("Erro ao buscar dados:", error.message);
        return res.status(500).json({ error: "Erro ao buscar dados das APIs." });
    }
});

// Inicializa o servidor
const PORT = 5500;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
