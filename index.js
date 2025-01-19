const http = require('http');
const express = require('express')
const app = express()
const bodyParser = require("body-parser")
const session = require('express-session')
const flash = require('connect-flash');
const path = require('path');
require('dotenv').config();

// Importando o BrowserSync
const browserSync = require('browser-sync').create();

//Exportando Minhas rotas
const connection = require("./database/database")
const router = require("./src/router")
const User = require("./src/User/userController")
const ClienteControler = require("./src/Controller/ClienteController")
const ProdutoController = require("./src/Controller/ProdutoController")
const Pedidos = require("./src/Controller/PedidosController")
const Venda = require("./src/Controller/VendaController")
const Relatorio = require("./src/Controller/RelatoriosController")
const Entregas = require("./src/Controller/EntregasController")
const ControleFinanceiroController = require("./src/Controller/ControleFinanceiroController.js")


const cors = require('cors');
// Configurar CORS
const allowedOrigins = ['http://localhost:3000','http://localhost:3001','http://localhost:3002', 'https://fron-end-construerp-production.up.railway.app', 'https://fron-end-construerp.vercel.app'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// app.use(cors({
//     // origin: 'http://localhost:3000',  // Endereço do React app
//     // credentials: true
//     origin: '*', // Permitir qualquer origem
//     credentials: true, // Permitir credenciais, ajuste conforme necessário
// }));



// configurando sessão
app.use(session({
    secret: 'fdsjkl22%%6667889)))@####',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 } // 7 days
}))
// configurando o flash
app.use(flash())

// Middlewere
app.use((req, res, next) => {
    //variaveis globais
    // res.locals.sucesso_msg = req.flash('sucesso_msg')
    // res.locals.erro_msg = req.flash('erro_msg')

    // res.locals.sucesso_msg_login = req.flash('sucesso_msg_login')
    // res.locals.erro_msg_login = req.flash('erro_msg_login')

   if(req.session.user){   // se a sessão estiver ativa user em partials recebe os dados do usuario logado (email)
    res.locals.user =  req.session.user
   }
   
    next()
})

// arquivos staticos
//app.use(express.static('public'))
app.use(express.static(__dirname + "/public/"));

// Views
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'ejs');


// Body Parser Formulários
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// app.listen(8080, () => { console.log("Logado") })
// app.listen(process.env.PORT || 3000 , () => { console.log("Server On....") })

// Iniciando o servidor e o BrowserSync
const server = http.createServer(app);
server.listen(process.env.PORT || 5000, () => {
    console.log("Server On....http://localhost:5000")
    // Iniciar o BrowserSync após o servidor
    // browserSync.init({
    //     proxy: 'http://localhost:3000', // Porta em que o seu aplicativo Node.js está rodando
    //     files: ['./src/**/*.js', './src/**/*.css', './src/views/**/*.ejs'], // Arquivos a serem monitorados pelo BrowserSync
    //     browser: 'chrome', // Navegador a ser aberto automaticamente pelo BrowserSync
    //     notify: false // Desabilitar notificações do BrowserSync no terminal
    // });
});


// banco de dados

connection
    .authenticate()
    .then(() => {
        // console.log("Conectado ao banco")
    }).catch((erro) => {
        console.log(erro)
    })


//Usando Rotas 
app.use("/", router)
app.use("/", ClienteControler)
app.use("/", ProdutoController)
app.use("/", Pedidos)
app.use("/", Venda)
app.use("/", User)
app.use("/", Relatorio)
app.use("/", Entregas)
app.use("/", ControleFinanceiroController)


