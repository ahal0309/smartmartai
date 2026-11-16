# RAG Chatbot Implementation

This project includes a **Retrieval-Augmented Generation (RAG)** powered chatbot with map and waypoint navigation support.

## Features

✅ **Floating chat widget** - Bottom-right corner on all pages  
✅ **Context-aware responses** - Uses store knowledge base  
✅ **Product location assistance** - "Where is milk?" → "Aisle A2"  
✅ **Map navigation help** - Explains store layout and waypoint system  
✅ **Image support** - Upload product photos for identification  
✅ **Conversation history** - Maintains context across messages  
✅ **Source citations** - Shows where information came from  

## Current Implementation

### In-Memory RAG (Active)
- **Method**: Keyword-based search in structured knowledge base
- **Data**: Products, store policies, navigation, recipes
- **Performance**: Fast, no external dependencies
- **Best for**: Development and small catalogs

### Knowledge Base Contents
- **56+ products** across 10 aisles (A-J)
- **Store policies** (hours, returns, delivery, payment)
- **Navigation guides** (layout, entrance, checkout, wayfinding)
- **Recipes** with ingredient locations

## Usage

### For Users
1. Click the 💬 icon in the bottom-right corner
2. Ask questions like:
   - "Where can I find milk?"
   - "Show me all products in Aisle B"
   - "How do I navigate to multiple items?"
   - "What are your store hours?"
   - "Give me a pancake recipe"

### For Developers

**API Endpoint**: `POST /api/chat`

**Request:**
```json
{
  "query": "Where is bread?",
  "image": "data:image/jpeg;base64,...", // optional
  "history": [
    { "role": "user", "content": "Previous message" }
  ]
}
```

**Response:**
```json
{
  "answer": "Bread is located at Aisle A1 (bakery section).",
  "sources": [
    { "title": "bread at Aisle A1" }
  ],
  "modelUsed": "gemini-1.5-flash-latest"
}
```

## Upgrading to Vector Search (Optional)

For **production** or **large catalogs**, upgrade to vector-based RAG:

### Option 1: ChromaDB (Local/Self-hosted)

**Install:**
```bash
npm install chromadb
```

**Ingest data:**
```bash
npx ts-node scripts/ingest-knowledge.ts
```

**Update `/api/chat`:**
```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collection = await client.getCollection({ name: "smart_cart" });

const results = await collection.query({
  queryEmbeddings: [queryEmbedding],
  nResults: 5,
});
```

**Pros**: Free, local, fast setup  
**Cons**: Not cloud-native, manual scaling

---

### Option 2: Pinecone (Managed Cloud)

**Install:**
```bash
npm install @pinecone-database/pinecone
```

**Setup:**
```typescript
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index("smart-cart");

await index.query({
  vector: queryEmbedding,
  topK: 5,
  includeMetadata: true,
});
```

**Pros**: Scalable, managed, production-ready  
**Cons**: Paid service (free tier available)

---

### Option 3: Qdrant (Fast & Self-hosted)

**Install:**
```bash
npm install @qdrant/js-client-rest
```

**Setup:**
```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "http://localhost:6333" });

await client.search("smart_cart", {
  vector: queryEmbedding,
  limit: 5,
});
```

**Pros**: Extremely fast, Rust-based, self-hosted or cloud  
**Cons**: Requires Qdrant server setup

---

### Option 4: MongoDB Atlas Vector Search

Since you already use MongoDB:

**Enable vector search** in Atlas, add embeddings field to documents:

```typescript
await ProductsCollection.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: queryEmbedding,
      numCandidates: 100,
      limit: 5,
    }
  }
]);
```

**Pros**: Same database, no new service  
**Cons**: Newer feature, fewer examples

---

## RAG System Comparison

| System | Setup | Cost | Speed | Best For |
|--------|-------|------|-------|----------|
| **In-Memory** (current) | ✅ Easy | Free | Fast | Small catalogs, dev |
| **ChromaDB** | ✅ Easy | Free | Fast | Local-first, prototypes |
| **Pinecone** | ⚠️ API key | Paid | Fast | Production, scale |
| **Qdrant** | ⚠️ Server | Free | Very Fast | High-performance apps |
| **MongoDB Atlas** | ⚠️ Config | Free tier | Fast | If using MongoDB |
| **Supabase pgvector** | ⚠️ Setup | Free tier | Medium | If using Postgres |

## Advanced Features (Future)

- [ ] **Hybrid search** - Vector + keyword (BM25) for better recall
- [ ] **Reranking** - Cross-encoder to improve top results
- [ ] **Streaming responses** - Token-by-token for faster UX
- [ ] **Multi-modal search** - Search by product images (CLIP)
- [ ] **Persistent chat history** - Redis/MongoDB session storage
- [ ] **Analytics** - Track common queries and improve knowledge base

## Files

```
src/
├── components/
│   ├── ChatWidget.tsx           # Floating chat UI
│   └── DashboardLayout.tsx      # Layout with chat widget
├── app/api/
│   └── chat/
│       └── route.ts             # RAG-powered chat endpoint
scripts/
└── ingest-knowledge.ts          # Knowledge base builder
```

## Environment Variables

Required in `.env.local`:

```bash
# Gemini API (for chat responses)
GEMINI_API_KEY=your_gemini_api_key

# Optional: For vector search upgrade
# PINECONE_API_KEY=your_pinecone_key
# QDRANT_URL=http://localhost:6333
```

## Testing

**Test queries:**
```
✅ "Where is milk?"
✅ "Show me products in Aisle B"
✅ "What are your store hours?"
✅ "How do I use the map feature?"
✅ "Give me a recipe with eggs and flour"
✅ "Can I return perishable items?"
✅ Upload a product image
```

## Support

For questions or issues:
- Check console logs in browser DevTools
- Verify `GEMINI_API_KEY` is set in `.env.local`
- Test API directly: `POST http://localhost:3000/api/chat`

## Next Steps

1. ✅ Chat widget is live - test it now!
2. ⏳ Add more products to knowledge base
3. ⏳ Upgrade to vector search for production
4. ⏳ Add persistent chat history
5. ⏳ Implement streaming responses

---

**Built with:**  
💬 React + Next.js 14  
🧠 Google Gemini 1.5 Flash  
🔍 RAG (Retrieval-Augmented Generation)  
🗺️ A* Pathfinding for navigation
