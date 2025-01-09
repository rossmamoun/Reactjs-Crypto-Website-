# Choisissons une image Python 3.9 ou 3.10 officielle
FROM python:3.10-slim

# On fixe un répertoire de travail
WORKDIR /app

# On copie les fichiers de l'appli Python dans l'image
COPY . /app

# Lancer le script
# Si c’est un service qui tourne en continu
CMD ["python", "collect_crypto_data.py"]
