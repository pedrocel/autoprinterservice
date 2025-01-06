const axios = require('axios')
const puppeteer = require('puppeteer')
const printer = require('pdf-to-printer')
const fs = require('fs')

let lastPrintedTickedId = 0

function formatData(isoDate){
  const [year, month, day] = isoDate.split('-')
  return`${day}/${month}/${year}`
}

const getData = async () => {
  const {data} = await axios('https://api-eventos.pacsafe.com.br/api/entry-ticket/latest/api')
  return data
}

const mountHtml = async () => {
  const data = await getData()

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dados da API</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 90mm;  /* Largura de 80mm */
            height: 320mm; /* Altura de 297mm */
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          header {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
          }
          h1 {
            font-size: 24px;
            margin: 10px 0;
          }
          p {
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <header>
          <div>
     <img src="https://api-eventos.pacsafe.com.br/alagoano.jpg" alt="Campeonato Alagoano 2025" style="width: 331px; height: 186px; margin:8px;"/> 
            <br>
            <div style="display:flex; align-items:center; justify-content:center;">
            <div>
              <img src="https://api-eventos.pacsafe.com.br/storage/${data.event.home_team.logo_path}" alt="home_team" style="width:90px; height:90px;">
              <h3>${data.event.home_team.name}</h3>  
            </div>

              <p><strong>X</strong></p>

              <div>
                <img src="https://api-eventos.pacsafe.com.br/storage/${data.event.away_team.logo_path}" alt="away_team" style="width:90px; height:90px;">
                <h3>${data.event.away_team.name}</h3> 
                </div>
            </div>
            <p><strong>Detalhes do Evento</strong></p>
                <p style="line-height: 0.3;">${data.event.location}</p>
                <p style="line-height: 0.3;">${formatData(data.event.event_date.split(' ')[0])} ${data.event.event_date.split(' ')[1]}</p>
                <p style="line-height: 0.3;">${data.ticket_type.type}</p>
                <p style="line-height: 0.3;">R$ ${data.ticket_type.price.replace('.', '.')}</p>
            <p>__________________________________________</p>
            <p>Emissão: ${formatData(data.created_at.split('T')[0])} ${formatData(data.created_at.split('T')[1])} ${data.pac_number}</p>
            <p>APOLICE N° ${data.apolice.apolice}</p>
            <p>!<strong>Informações importantes</strong>!</p>
            <ul>
              <li>Este ingresso é pessoal e intransferivel</li>
              <li>Validação via QR-Code</li>
              <li>Após autenticado o ingresso será inválidado</li>
              <li>Mantha-o em local seguro até o evento</li>
            </ul>
            <p>- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - </p>
            <img src="https://api-eventos.pacsafe.com.br/storage/${data.qr_code_path}">
            <p>Emissão: ${formatData(data.created_at.split('T')[0])} ${data.pac_number}</p>
            <p style="line-height: 0.3;"><b>Detalhes do Evento</b></p>
            <p style="line-height: 0.3;">${data.event.title}</p>
            <p style="line-height: 0.3;">${data.event.location}</p>
            <p style="line-height: 0.3;">${formatData(data.event.event_date.split(' ')[0])} ${data.event.event_date.split(' ')[1]}</p>
            <p style="line-height: 0.3;">${data.ticket_type.type}</p>
            <p><center>Apresente este ingresso na entrada do evento.</center></p>
            <p><center>Copyright Pacsafe Tecnologia</center></p>
          </div>
        </header>
      </body>
    </html>
  `;
  
  console.log(html)

   const filePath = './temp.pdf'

  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(html)
    await page.pdf({
      path: filePath,
      width: '80mm',    // Largura 80mm
      height: '310mm',  // Altura 297mm
      printBackground: true,  // Imprime o fundo, caso haja
      margin: { top: 0, right: 0, bottom: 0, left: 0 } // Margens zeradas para usar todo o espaço
    });
    await browser.close()

    console.log("PDF gerado com sucesso!")
    
    // Agora, envia o PDF para a impressora
    await printPdf(filePath)

  } catch (error) {
    console.error("Erro ao gerar o PDF:", error)
  }

}

const printPdf = async (filePath) => {
  try {
    await printer.print(filePath)
    console.log('Impressão enviada com sucesso!')
  } catch (error) {
    console.error('Erro ao tentar imprimir:', error)
  } finally {
    // Remove o arquivo PDF temporário
    fs.unlinkSync(filePath)
    console.log('Arquivo PDF temporário removido.')
  }
}

setInterval( async () => {
  const data = await getData()
  console.log(data)
  console.log(data.id, lastPrintedTickedId)
  if(data.id !== lastPrintedTickedId){
    try{
    lastPrintedTickedId = data.id
    mountHtml()
    }catch(error){
      console.error(error)
    }
  }
}, 1000)
