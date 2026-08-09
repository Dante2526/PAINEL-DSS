export async function isInternetFastAndStable(): Promise<boolean> {
    // 1. Verificação básica nativa do navegador
    if (!navigator.onLine) return false;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s tolerância
        
        // 2. Requisição rápida, ignorando cache do navegador, para garantir que há internet real
        const res = await fetch('/manifest.json?_=' + new Date().getTime(), { 
            method: 'HEAD', 
            signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        return res.ok;
    } catch (e) {
        // Se der timeout ou erro de rede (offline real)
        return false;
    }
}
