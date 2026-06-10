# Come usare `config/projects.csv`

Il file `config/projects.csv` permette di aggiungere e modificare i progetti. Basta compilare il CSV, caricarlo su GitHub, e il sito si aggiorna automaticamente.

---

## Flusso automatico

```
Modifica projects.csv → push su GitHub
  → GitHub Action esegue csv-to-json.js (aggiorna projects.json)
  → GitHub Action esegue build.js (rigenera it/, en/, fr/, index.html)
  → Auto-commit con tutte le modifiche
```

---

## Regole base del CSV

- **Separatore**: punto e virgola `;`
- **Testo con punto e virgola o virgole**: racchiudere tra virgolette doppie `"..."`
- **Virgolette nel testo**: raddoppiarle `""così""`
- **Codifica**: UTF-8
- **Righe vuote**: ignorate automaticamente

---

## Colonne

| Colonna | Obbligatorio | Valori | Note |
|---------|:-----------:|--------|------|
| `id` | ✓ | stringa slug | Chiave univoca. Usare solo lettere minuscole, numeri e trattini. Es: `sinai-reportage-2014` |
| `visible` | ✓ | `true` / `false` | `false` = il progetto esiste ma non è visibile sul sito |
| `order` | ✓ | numero intero | Ordine di visualizzazione all'interno della categoria (1 = primo) |
| `date` | ✓ | `YYYY-MM-DD` | Data di pubblicazione |
| `title_it` | ✓ | testo | Titolo in italiano |
| `title_en` | ✓ | testo | Titolo in inglese |
| `title_fr` | ✓ | testo | Titolo in francese |
| `section` | — | `journalism` / `ngo` | Necessario solo per **nuove categorie** (vedi sezione dedicata) |
| `categories` | ✓ | slug separati da virgola | Categorie a cui appartiene il progetto. Es: `longform-reportage` |
| `subcategory` | — | slug | Sottocategoria. Es: `migration-displacement` |
| `mainpage` | ✓ | `true` / `false` | `true` = appare nello showreel/carousel della home |
| `category_cover` | — | `true` / `false` | `true` = la `thumbnail_url` di questo progetto viene usata come immagine della colonna landing per la sua categoria (vedi "Cover delle categorie" più sotto) |
| `category_cover_url` | — | URL o path relativo | Immagine **dedicata** per la colonna landing della categoria. Se valorizzata, ha priorità su `category_cover`. Usala per immagini ritagliate apposta per il formato verticale della colonna. Es: `../media/covers/longform-cover.jpg` |
| `articleUrl` | — | URL | Link all'articolo/fonte esterna |
| `thumbnail_url` | — | URL o path relativo | Immagine di anteprima. Path relativi: `../media/thumbnails/nome.jpg` |
| `thumbnail_fallbackGradient` | — | CSS gradient | Sfondo se la thumbnail non si carica. Lasciare vuoto per usare il default |
| `video_type` | — | `youtube` / `vimeo` | Compilare solo se il progetto ha un video incorporato |
| `video_id` | — | stringa | ID del video su YouTube o Vimeo |
| `video_src` | — | URL | URL diretto al file video (alternativa a `video_id`) |
| `allegati` | — | `url\|label,url\|label,...` | Lista di allegati/link (vedi formato sotto) |
| `testo_it` | — | testo lungo | Corpo del testo in italiano |
| `testo_en` | — | testo lungo | Corpo del testo in inglese |
| `testo_fr` | — | testo lungo | Corpo del testo in francese |
| `description_it` | — | testo breve | Descrizione corta in italiano (usata nei meta e nelle card) |
| `description_en` | — | testo breve | Descrizione corta in inglese |
| `description_fr` | — | testo breve | Descrizione corta in francese |
| `tags_format` | — | testo | Formato del lavoro. Es: `Reportage scritto`, `Documentario 52'` |
| `tags_role` | — | testo | Ruolo. Es: `Giornalista`, `Regista` |
| `tags_location` | — | testo | Luogo. Es: `Egitto`, `Francia, Belgio` |

---

## Formato allegati

Gli allegati sono link aggiuntivi (PDF, articoli, versioni del lavoro). Formato:

```
url1|label1,url2|label2
```

Se il testo contiene virgole, racchiudere l'intera cella tra virgolette:

```
"../media/sinai.pdf|Articolo Left,https://limes.it/...|Limes"
```

Esempio reale:
```
"../media/longform-reportage/sinai.pdf|Sinai (Left),https://vimeo.com/207909226|Video (Vimeo)"
```

---

## Testi lunghi con paragrafi

Per testi con ritorni a capo, racchiudere l'intera cella tra virgolette e usare `\n\n` per i paragrafi:

```
"Primo paragrafo del testo.\n\nSecondo paragrafo."
```

---

## Aggiungere un nuovo progetto

Aggiungere una riga con un `id` che non esiste ancora nel sistema. Esempio minimo:

```
mio-nuovo-articolo;true;10;2026-03-15;Titolo IT;Title EN;Titre FR;;longform-reportage;;false;https://link-articolo.com;../media/thumbnails/mio-articolo.jpg;;;;;;;;;;;;;Reportage scritto;Giornalista;Turchia
```

---

## Modificare un progetto esistente

Aggiungere una riga con l'`id` esatto del progetto esistente. Lo script sovrascrive solo quel progetto, lasciando intatti tutti gli altri.

---

## Aggiungere una nuova categoria o sottocategoria

Se la categoria che si usa in `categories` **non esiste ancora** nel menu di navigazione, compilare anche la colonna `section` (`journalism` o `ngo`). Lo script la registra automaticamente.

**Esempio — nuova categoria `video-essays` nella sezione Journalism:**

```
mio-video;true;1;2026-04-01;Titolo;Title;Titre;journalism;video-essays;;false;;...
```

Risultato automatico in `projects.json`:
```json
"journalism": {
  "order": ["documentary-films", "multimedia-projects", "longform-reportage", "video-essays"]
}
```

La categoria apparirà nel menu come **Video Essays** (slug convertito). Per una label personalizzata in italiano/inglese/francese, aggiungere manualmente la chiave in `config/i18n/it.json`, `en.json`, `fr.json` sotto `"categories"`:
```json
"categories": {
  "video-essays": "Video Saggi"
}
```

**Esempio — nuova sottocategoria `refugees` dentro `longform-reportage`:**

```
mio-articolo;true;5;2026-04-01;Titolo;Title;Titre;journalism;longform-reportage;refugees;false;;...
```

---

## Categorie esistenti

### Journalism
| Slug | Label attuale |
|------|--------------|
| `documentary-films` | Documentary Films |
| `multimedia-projects` | Multimedia Projects |
| `longform-reportage` | Longform Reportage |

### NGO
| Slug | Label attuale |
|------|--------------|
| `documentary-series` | Documentary Series |
| `field-missions` | Field Missions |
| `multimedia-projects-coordination` | Multimedia Projects Coordination |

---

## Cover delle categorie

Le pagine landing di sezione (es. `/it/giornalismo.html`, `/it/ngo.html`) mostrano una colonna verticale per ogni categoria, con un'immagine di sfondo (CSS `background-size: cover`). Ci sono **due modi** per scegliere l'immagine, con priorità:

### Opzione 1 — Immagine dedicata (consigliata)

Usa la colonna `category_cover_url` per puntare a un'immagine **preparata apposta** per il formato verticale della colonna (così eviti il crop indesiderato della thumbnail landscape).

1. Caricare l'immagine in `media/` (es. `media/covers/longform-cover.jpg`).
2. Su una riga di un progetto della categoria interessata, scrivere il path in `category_cover_url`: `../media/covers/longform-cover.jpg`.
3. Quella URL verrà usata come sfondo della colonna per ciascuna delle `categories` di quel progetto.

### Opzione 2 — Riusa la thumbnail di un progetto

Se ti va bene riusare la thumbnail di un progetto (formato landscape, verrà croppata al centro):

1. Sulla riga del progetto, mettere `true` nella colonna `category_cover`.
2. La sua `thumbnail_url` verrà usata come sfondo della colonna.

### Priorità e regole

L'ordine di precedenza per scegliere l'immagine della colonna è:

1. Primo progetto della categoria con `category_cover_url` valorizzato → usa quella URL.
2. Altrimenti, primo progetto con `category_cover=true` → usa la sua `thumbnail_url`.
3. Altrimenti, primo progetto per `order` → usa la sua `thumbnail_url` (comportamento storico).

In tutti i casi "primo" = quello con `order` più basso. I campi `category_cover` e `category_cover_url` sono indipendenti da `mainpage` e da `order`: un progetto può fornire la cover di una categoria senza apparire nello showreel e senza essere in cima alla lista.

**Esempio:** per mostrare un'immagine dedicata nella colonna "Longform Reportage" della pagina Giornalismo, scegli un progetto qualsiasi di quella categoria e scrivi nella sua riga: `category_cover_url = ../media/covers/longform-cover.jpg`.

---

## Ordine dello showreel

Lo showreel è il carousel a tutto schermo della home page. Mostra **solo i progetti con `mainpage=true`**, ordinati per il campo `order` ascendente:

- `order=1` → prima slide
- `order=2` → seconda slide
- ... e così via

**Da sapere:**
- Il campo `order` è lo stesso usato per ordinare i progetti all'interno della categoria. Cambiare l'`order` di un progetto sposta sia la sua posizione nello showreel sia la sua posizione nella griglia della categoria.
- Se non usi `category_cover`, l'`order` controlla anche quale progetto fornisce l'immagine della colonna landing della categoria (il primo per `order`). Per disaccoppiare cover e showreel, usa `category_cover` come descritto sopra.
- I progetti con `mainpage=false` non appaiono nello showreel anche se hanno un `order` basso.

**Esempio:** per riordinare lo showreel, modificare il campo `order` dei progetti con `mainpage=true` nel CSV.

---

## Comportamento dello script

- **Riga con `id` già esistente** → il progetto viene aggiornato
- **Riga con `id` nuovo** → il progetto viene aggiunto in coda
- **CSV con solo header (nessuna riga dati)** → il JSON non viene toccato
- **Riga senza `id`** → ignorata con avviso nel log
- **Colonna `section` assente o vuota** → la categoria non viene auto-registrata (il progetto viene comunque salvato)
