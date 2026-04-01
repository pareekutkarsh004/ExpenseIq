import mongoose,{Schema} from "mongoose";

const groupSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    members:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
},{timestamps:true});

const Group = mongoose.model("Group", groupSchema);
export default Group;