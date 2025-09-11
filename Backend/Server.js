import dotenv from "dotenv";
import connectDB from "./src/Config/db.js";
import app from "./src/config/app.js";

dotenv.config({
  path: "./.env"   // agar .env backend ke andar hi hai
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 4000, () => {
      console.log(`🚀 Server is running at port : ${process.env.PORT || 4000}`);
    });
  })
  .catch((err) => {
    console.log("❌ MONGO db connection failed", err);
  });
