import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient } from "npm:mongodb@6.3.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

let cachedClient: MongoClient | null = null;

function fixMongoUri(raw: string): string {
  // Fix URIs where password contains unencoded special chars like @
  const match = raw.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^@]+)$/);
  if (match) {
    const [, protocol, user, password, rest] = match;
    return `${protocol}${encodeURIComponent(user)}:${encodeURIComponent(password)}@${rest}`;
  }
  return raw;
}

async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  const rawUri = Deno.env.get('MONGODB_URI');
  if (!rawUri) throw new Error('MONGODB_URI not configured');
  const uri = fixMongoUri(rawUri);
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, database, collection, document, filter, update, options } = await req.json();

    if (!database || !collection || !action) {
      return new Response(JSON.stringify({ error: 'database, collection, and action are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const client = await getClient();
    const db = client.db(database);
    const coll = db.collection(collection);

    let result: any;

    switch (action) {
      case 'find': {
        const docs = await coll.find(filter || {}, options || {}).toArray();
        result = { documents: docs };
        break;
      }
      case 'findOne': {
        const doc = await coll.findOne(filter || {});
        result = { document: doc };
        break;
      }
      case 'insertOne': {
        if (!document) throw new Error('document is required for insertOne');
        const res = await coll.insertOne({ ...document, createdAt: new Date() });
        result = { insertedId: res.insertedId };
        break;
      }
      case 'insertMany': {
        const docs = (document as any[]).map(d => ({ ...d, createdAt: new Date() }));
        const res = await coll.insertMany(docs);
        result = { insertedIds: res.insertedIds };
        break;
      }
      case 'updateOne': {
        if (!filter || !update) throw new Error('filter and update are required');
        const res = await coll.updateOne(filter, { ...update, $set: { ...update.$set, updatedAt: new Date() } });
        result = { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
        break;
      }
      case 'deleteOne': {
        if (!filter) throw new Error('filter is required for deleteOne');
        const res = await coll.deleteOne(filter);
        result = { deletedCount: res.deletedCount };
        break;
      }
      case 'deleteMany': {
        if (!filter) throw new Error('filter is required for deleteMany');
        const res = await coll.deleteMany(filter);
        result = { deletedCount: res.deletedCount };
        break;
      }
      case 'count': {
        const count = await coll.countDocuments(filter || {});
        result = { count };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('MongoDB error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
