const mongoose = require("mongoose");
const folowersSchem=new mongoose.Schema({
    idUser:{type:String,required:true},
    folowers:{type:Array,default:[]}
})
const Folowers=mongoose.model("Followers",folowersSchem);
module.exports=Folowers;
     

