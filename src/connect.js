require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const supabase = require('./config/supabaseClient.js'); // Importando a conexão com o Supabase

const app = express();
app.use(cors());
app.use(express.json()); // Permite processar JSON no corpo da requisição

// Credenciais das APIs
const TMDB_ACCESS_TOKEN = "3e77b0edc4a3f1ba70dba05d0c1423ab";
const OMDB_API_KEY = "3adb50b9";

// Endpoint para buscar o filme e salvar no Supabase
app.get('/get_film/:title', async (req, res) => {
    const { title } = req.params; // Nome do filme

    try {
        // 1. Consulta à API TMDb para buscar informações detalhadas do filme
        const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie`;
        console.log('Chamando TMDb API:', tmdbSearchUrl);

        const tmdbResponse = await axios.get(tmdbSearchUrl, {
            params: {
                query: title,
                api_key: TMDB_ACCESS_TOKEN,
                language: "pt-BR", // Alterar para outro idioma, se necessário
            },
            headers: {
                "Content-Type": "application/json;charset=utf-8",
            },
        });

        const tmdbData = tmdbResponse.data;

        if (!tmdbData.results || tmdbData.results.length === 0) {
            return res.status(404).json({ error: "Filme não encontrado na TMDb" });
        }

        // Seleciona o primeiro resultado
        const tmdbMovie = tmdbData.results[0];
        const { id, title: tmdbTitle, overview, release_date, vote_average } = tmdbMovie;
/*
        // 2. Consulta à API TMDb para buscar o trailer do filme
        const tmdbVideosUrl = `https://api.themoviedb.org/3/movie/${id}/videos`;
        console.log('Chamando TMDb Videos API:', tmdbVideosUrl);

        const tmdbVideosResponse = await axios.get(tmdbVideosUrl, {
            params: {
                api_key: TMDB_ACCESS_TOKEN,
                language: "pt-BR", // Alterar para outro idioma, se necessário
            },
            headers: {
                "Content-Type": "application/json;charset=utf-8",
            },
        });

        const tmdbVideosData = tmdbVideosResponse.data;

        // Encontra o primeiro vídeo do tipo "Trailer"
        const trailer = tmdbVideosData.results.find(video => video.type === "Trailer" && video.site === "YouTube");
        const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "Trailer não disponível";
*/
        // 3. Consulta à API OMDb para buscar o pôster
        const omdbUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`;
        console.log('Chamando OMDb API:', omdbUrl);

        const omdbResponse = await axios.get(omdbUrl);
        const omdbData = omdbResponse.data;

        if (omdbData.Response === "False") {
            return res.status(404).json({ error: "Imagem do filme não encontrada na OMDb" });
        }

        const omdbPoster = omdbData.Poster;

        // 4. Salvar os dados no Supabase
        const { error } = await supabase
            .from('filmes')
            .insert({
                title: tmdbTitle,
                plot: overview,
                //trailer: trailerUrl,
                image: omdbPoster,
                release_date: release_date,
                vote_average: vote_average,
            });

        if (error) {
            console.error('Erro ao salvar no Supabase:', error.message);
            return res.status(500).json({ error: "Erro ao salvar dados no Supabase" });
        }

        // 5. Retornar os dados para o frontend
        return res.json({
            tmdb: {
                id,
                title: tmdbTitle,
                overview,
                release_date,
                vote_average,
                //trailer: trailerUrl,
            },
            omdb: {
                poster: omdbPoster,
            },
            message: "Filme salvo com sucesso no Supabase!",
        });
    } catch (error) {
        console.error("Erro ao buscar dados:", error.message);
        return res.status(500).json({ error: "Erro ao buscar dados das APIs" });
    }
});

// Inicializa o servidor
const PORT = 5500;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
