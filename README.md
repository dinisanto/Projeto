## Configuração do Projeto

1. Clone o repositório ou copie os arquivos para um diretório de sua escolha.
2. Abra o arquivo `app/main.py` e substitua `YOUR_OPENWEATHERMAP_API_KEY` e `YOUR_UNSPLASH_ACCESS_KEY` com as suas chaves de API para OpenWeatherMap e Unsplash, respectivamente.


## Executando o Projeto com Docker

1. **Construir a Imagem Docker**

   No diretório raiz do projeto, execute o comando abaixo para construir a imagem Docker. Usamos o nome `weather_image_api` para facilitar o controle e execução do container posteriormente.

   ```bash
   docker build -t weather_image_api .

2. **Executar o Container**
   ```bash
   docker run -p 5000:5000 --name weather_image_api_container weather_image_api

- -p 5000:5000: Mapeia a porta 5000 do container para a porta 5000 do seu sistema, permitindo o acesso à API.
- --name weather_image_api_container: Define um nome para o container, facilitando parar ou reiniciar o container posteriormente.

3. **Parar o Container**
- Se estiver rodando o container diretamente no terminal, você pode parar a execução com CTRL + C.
- Se estiver rodando o container em segundo plano, você pode parar o container com o comando abaixo:
  ```bash
  docker stop weather_image_api_container
  
- Para remover o container, execute:
  ```bash
  docker rm weather_image_api_container

5. **Acessando a API**

Após iniciar o container, acesse a API em http://127.0.0.1:5000/get_weather_image/<NOME DA CIDADE>, substituindo <NOME DA CIDADE> pelo nome da cidade em inglês.

#### Exemplo de Requisição
Para obter o clima e uma imagem de clima para Lisbon, acesse:
```bash
http://127.0.0.1:5000/get_weather_image/Lisbon
```

A API retornará uma resposta JSON no seguinte formato:
```json
{
  "city": "Lisbon",
  "image_url": "https://images.unsplash.com/photo-1523216406419-13246d50974f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NzE2NTR8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzA2NjA2MTR8&ixlib=rb-4.0.3&q=80&w=400",
  "weather": {
    "condition": "Rain",
    "description": "light rain",
    "temperature": "20.03°C"
  }
}
