export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Logik für die Synchronisierung und Datenspeicherung (über /api/)
    if (url.pathname.startsWith("/api/")) {
      const key = url.pathname.replace("/api/", ""); // Entfernt "/api/" für den KV-Schlüssel

      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          }
        });
      }

      try {
        switch (request.method) {
          case "GET":
            if (!key) {
              const allKeys = await env.FILES_KV.list();
              return new Response(JSON.stringify(allKeys), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
              });
            }
            const value = await env.FILES_KV.get(key);
            if (value === null) return new Response("Datei nicht gefunden", { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
            return new Response(value, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });

          case "PUT":
          case "POST":
            if (!key) return new Response("Dateiname fehlt", { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
            const bodyText = await request.text();
            await env.FILES_KV.put(key, bodyText);
            return new Response(`Erfolgreich gespeichert: ${key}`, { status: 201, headers: { "Access-Control-Allow-Origin": "*" } });

          case "DELETE":
            if (!key) return new Response("Dateiname fehlt", { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
            await env.FILES_KV.delete(key);
            return new Response(`Erfolgreich gelöscht: ${key}`, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
        }
      } catch (error) {
        return new Response(`API-Fehler: ${error.message}`, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
      }
    }

    // 2. Logik für das Laden der Webseite
    // Leitet alle anderen Anfragen an die HTML-Dateien im public-Ordner weiter
    return env.ASSETS.fetch(request);
  }
};
