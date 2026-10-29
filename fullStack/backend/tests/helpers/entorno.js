// Variables que la app necesita en los tests (se cargan antes de cada archivo)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_test';
process.env.CRYPTO_KEY = process.env.CRYPTO_KEY || 'clave_de_test';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'key_falsa_de_test'; // la IA se mockea siempre
