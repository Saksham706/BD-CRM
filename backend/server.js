const express  = require("express")
const mongoose =  require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res) =>{
          res.send("Lead Management CRM Server is Running!");
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () =>{
          console.log(`Server running on port ${PORT}`);
})