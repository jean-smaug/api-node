# API

Pour lancer le serveur : `npm start` ou `yarn start`

## Routes

### POST - `/upload`

Uploader une image

Corps de la requête :

- `image` : fichier image
- `name` : chaine de caractères | optionnel

### GET - `/files/:name`

Obtenir l'URL d'une image

### GET - `/items`

Retourne un tableau d'éléments avec un id, un titre et une description

```json
[
  {
    "id": "eazeaz-fezfez-azdzdz-adzfa",
    "title": "Hello world",
    "description": "Splendide !"
  },
  {
    "id": "ze9302-fe32fz-a32d0dz-d9zfa",
    "title": "Foo bar",
    "description": "YATA !"
  }
]
```

### POST - `/items`

Créé un nouvel élément

Corps de la requête :

- `title` : titre de l'élément
- `description` : description de l'élément

Retourne l'id de l'élément créé

### DELETE - `/items`

Supprime tous les éléments
