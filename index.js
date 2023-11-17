const { Client } = require('whatsapp-web.js');
const mysql = require('mysql2');
const client = new Client();
const qrcode = require('qrcode-terminal');
const readline = require('readline');

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password',
	database: 'whatsappBot',
	port: 3306
});
connection.connect(function(err) {
	if (err) throw err;
	console.log('Conectado a la base de datos');
});
connection.query('CREATE DATABASE IF NOT EXISTS whatsappBot', function(err, result){});
connection.query('USE whatsappBot', function(err, result){});
connection.query('CREATE TABLE IF NOT EXISTS Consultas (id INT AUTO_INCREMENT PRIMARY KEY,cedula VARCHAR(12))', function(err, result){
		if (err) throw err;
		console.log('Tabla creada');
	});


async function run() {
  client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('¡Bien! WhatsApp conectado.');
  });

  await client.initialize();

  function cumprimentar() {
    const dataAtual = new Date();
    const hora = dataAtual.getHours();

    let saudacao;

    if (hora >= 6 && hora < 12) {
      saudacao = "Buenos días!";
    } else if (hora >= 12 && hora < 19) {
      saudacao = "Buenas tardes!";
    } else {
      saudacao = "Buenas noches!";
    }

    return saudacao;
  };

  const delay = ms => new Promise(res => setTimeout(res, ms));
  client.on('message', async msg => {
    if (
      msg.body.match(/(buenas noches|buenos dias|buenas tardes|hola|dia|informacion|si|videos|audios|teste)/i) &&
      msg.from.endsWith('@c.us')
    ) {
      const chat = await msg.getChat();
      chat.sendStateTyping();
      await delay(3000);
      const saudacoes = cumprimentar();
      await client.sendMessage(msg.from, `${saudacoes} Bienvenido \n1. Saludo General \n2. Consultas Basicas \n3. Salir`);
		}
		else if(msg.body.match(/(1|2|3)/i) && msg.from.endsWith('@c.us')){
			const chat = await msg.getChat();
      chat.sendStateTyping();
      await delay(3000);
			const saudacoes = cumprimentar();
			let eleccion = parseInt(msg.body);
			switch (eleccion) {
			case 1:
				await client.sendMessage(msg.from, `${saudacoes} Es un gusto tenerte aqui,espero que disfrutes de nuestro servicio`);
				break;
			case 2:
				await client.sendMessage(msg.from, `Ingrese por favor su numero de cedula para realizar el agendamiento de la consulta`);
			  const respuestaUsuario = await waitForResponse();
        const identificacion = respuestaUsuario.body;
				let auxl;	
					connection.query('INSERT INTO Consultas (cedula) VALUES (?)',[identificacion], function(err,result){
						if (err) throw err;
						console.log('Registro insertado', result.insertId);
						 
					});	
					connection.query('SELECt id  FROM Consultas WHERE cedula = ?',[identificacion], function(err,result){
						if (err) throw err;
						auxl = result[0].id;
						console.log('Registro numero', result[0].id);
						 
					});
					await client.sendMessage(msg.from, `Su numero de cedula es: ${identificacion}, procesaremos su solicitud y le enviaremos un mensaje con la fecha y hora de su cita`);
				break;	
			case 3:
				await client.sendMessage(msg.from, `Salir`);
				break;

   }  
		await client.sendMessage(msg.from, '¿Hay algo más en lo que pueda ayudarte?');
  	
  }});

  function waitForResponse() {
    return new Promise((resolve, reject) => {
      client.on('message', async msg => {
        if (msg.from.endsWith('@c.us')) {
          resolve(msg);
        }
      });
    });
  };
};

run().catch(err => console.error(err));

