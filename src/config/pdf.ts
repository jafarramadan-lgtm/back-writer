const path = require("path");
const fs = require("fs");
 const PDF = (
  arr: { title: string; content: string }[],
  writer: string,
  image: string,
): string => {
  const localImage = path.join(__dirname, "./dashboard.png");
  const base64Image = fs.readFileSync(localImage, { encoding: "base64" });
  const fallbackImage = `data:image/png;base64,${base64Image}`;
  const finalImage = image && image.trim() !== "" ? image : fallbackImage;
  return `
    <Doctype html>
    <html lang="ar" dir="rtl">
    <head>
    <meta charset="UTF-8"/>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: right;
            direction: rtl;
            background:#e1ba80e1;
            width:100%;
              }
            p{    
              padding:3px ;
               font:italic;
              color: black;
               width:fit-content;
 
              }
              h1{
              width:fit-content;
              padding:3px ;
              color: white;
              font:bold; 
                }
               h2{     
              padding:3px ;
               width:fit-content;
                font:italic;
              color: black;
               font:bold;
 
               }
               
                .top{
                display:flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                width:100%;
                height:100vh;
                page:break-before;
                avoid:break-inside;
                background:#e1ba80e1;
                }
                image{
                width: 200px;
                height: auto;
                }
                .con{
                display:flex;
                flex-direction: column;
                justify-content: start;
                align-items: center;
                width:100%;
                min-height:100vh;
                page:break-before;
                avoid:break-inside;
                }
               
    </style>
    </head>
    <body>
  <div class='top'>  
      <image src=${finalImage} alt="image story" />
      <h1> بقلم الكاتب ${writer} </h1>
  </div>
        ${arr
          .map(
            (item) => `
          <div class='con'>
                 <h2>${item.title}</h2>
                 <p>${item.content}</p>
          </div>`,
          )
          .join("")}
    </body>
    </html>
    `;
};
module.exports = {PDF};