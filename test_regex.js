const html = '<meta property="og:title" content="InoEvents Angola | Convites Digitais de Casamento, Chá de Panela e Gestão de Eventos" />';
const result = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/g, 'REPLACED');
console.log(result);
