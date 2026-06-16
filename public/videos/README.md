# Vidéos de la landing (section "Copafever en vrai" — feeling TikTok)

Dépose ici tes vidéos verticales. Tant qu'un fichier n'est pas présent, la carte
affiche un emplacement stylé « Vidéo bientôt » — la page reste publiable.

## Comment ajouter une vidéo

1. **Le fichier vidéo** (recommandé plutôt qu'un lien YouTube/TikTok) :
   - format `.mp4` (codec H.264) — ajoute aussi `.webm` si possible
   - vertical **9:16**, idéalement **1080×1920**
   - **court** (5–15 s, ça tourne en boucle muette comme un feed TikTok)
   - compressé : vise **< 3 Mo** par clip
   - nomme-le comme dans la config : `reel-1.mp4`, `reel-2.mp4`, …

2. **Le poster** (1ʳᵉ image, évite l'écran noir au chargement) :
   - `reel-1.jpg`, `reel-2.jpg`, … (même nom que la vidéo)

3. **Renseigne la config** : `lib/landing-videos.ts`
   ```ts
   {
     id: "reel-1",
     src: "/videos/reel-1.mp4",
     poster: "/videos/reel-1.jpg",
     author: "@0xcopa",
     caption: "C'est quoi Copafever en 30 secondes 👀",
     href: "https://www.tiktok.com/@0xcopa",
   }
   ```

## Compresser une vidéo (ffmpeg)

```bash
ffmpeg -i source.mov -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libx264 -crf 28 -preset slow -movflags +faststart -an reel-1.mp4

# poster (1ʳᵉ frame)
ffmpeg -i reel-1.mp4 -vframes 1 -q:v 3 reel-1.jpg
```

> Si les clips deviennent lourds/nombreux, héberge-les sur **Vercel Blob** plutôt
> que dans le repo, et mets l'URL Blob dans `src`.
