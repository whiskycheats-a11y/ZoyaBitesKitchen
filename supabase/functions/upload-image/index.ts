import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cloudName = (Deno.env.get('CLOUDINARY_CLOUD_NAME') || '').replace(/^CLOUDINARY_CLOUD_NAME=/, '').trim();
    const apiKey = (Deno.env.get('CLOUDINARY_API_KEY') || '').replace(/^CLOUDINARY_API_KEY=/, '').trim();
    const apiSecret = (Deno.env.get('CLOUDINARY_API_SECRET') || '').replace(/^CLOUDINARY_API_SECRET=/, '').trim();

    console.log('Cloudinary config check:', { cloudName: !!cloudName, apiKey: !!apiKey, apiKeyLength: apiKey.length, apiSecret: !!apiSecret });

    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'Cloudinary not configured', details: { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = 'zoyabites';
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

    // Generate signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(apiSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Cloudinary uses SHA-1 for signature, let's use the simple approach
    // Actually Cloudinary expects SHA-1, let's use a different method
    const msgUint8 = encoder.encode(paramsToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('api_key', apiKey);
    uploadData.append('timestamp', timestamp);
    uploadData.append('signature', signature);
    uploadData.append('folder', folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: uploadData }
    );

    const result = await uploadRes.json();
    console.log('Cloudinary response status:', uploadRes.status, 'result:', JSON.stringify(result).substring(0, 500));

    if (!uploadRes.ok) {
      return new Response(JSON.stringify({ error: result.error?.message || 'Upload failed', details: result }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: result.secure_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
