const fs = require('fs');

let lp = fs.readFileSync('features/landing/LandingPage.tsx', 'utf8');

const newFeatures = `            <FeatureCard 
              icon="send_to_mobile" 
              title="Envio via WhatsApp"
              desc="Dispare os convites e lembretes diretamente pelo WhatsApp dos seus convidados de forma automática."
            />
            <FeatureCard 
              icon="language" 
              title="Domínio Personalizado"
              desc="Tenha um link exclusivo para o seu evento (ex: oseucasamento.com), garantindo muito mais requinte e exclusividade."
            />
            <FeatureCard 
              icon="table_restaurant" 
              title="Mapa das Mesas"
              desc="Organize graficamente onde cada convidado vai sentar e crie uma experiência fluida para a recepção."
            />
            <FeatureCard 
              icon="menu_book" 
              title="Livro de Assinaturas Digital"
              desc="Um mural onde os convidados podem deixar recados carinhosos, fotos e votos de felicidade para os anfitriões."
            />
            <FeatureCard 
              icon="bar_chart" 
              title="Estatísticas em Tempo Real"
              desc="Acompanhe gráficos detalhados de presenças, respostas e presentes através de um painel de organizador completo."
            />
            <FeatureCard 
              icon="smart_toy" 
              title="Assistente IA"
              desc="Inteligência Artificial para ajudar a responder a dúvidas dos convidados sobre trajes, localização e presentes."
            />
          </div>`;

lp = lp.replace(
  /            <FeatureCard \n              icon="send_to_mobile" [\s\S]*?<\/div>/,
  newFeatures
);

fs.writeFileSync('features/landing/LandingPage.tsx', lp);
console.log("Updated FeatureCards in LandingPage");
