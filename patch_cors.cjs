const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const corsConfig = `const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes('.run.app') || 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin === 'https://www.inoevent.online' || 
      origin === 'https://inoevent.online'
    ) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  }
};
app.use(cors(corsOptions));`;

content = content.replace("app.use(cors());", corsConfig);

fs.writeFileSync('server.ts', content);
