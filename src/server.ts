const express = require("express");
const app = express();
const userRoutes = require("./routes/users.js");
const settingsRoutes = require("./routes/settings.js");
const writerRoutes = require("./routes/writer.js");
const readerRoytes = require("./routes/reader.js");
const cors = require("cors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");

app.use(cookieParser());
connectDB();
app.use(express.json());
// const corsOptions = {
//   origin:function(a:any,b:(x:any,y:boolean)=>void){
//   b(null,true)
// },
//   methods: "GET,POST,PUT,DELETE",
//   allowedHeaders: "Content-Type,Authorization",
//   credentials: true,
// };
app.use(cors({
  origin:"https://writer-mocha.vercel.app",
  credentials:true
}));

app.use("/", userRoutes);
app.use("/settings", settingsRoutes);
app.use("/writer", writerRoutes);
app.use("/reader", readerRoytes);
const PORT=process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("server is running on port ",PORT);
});
