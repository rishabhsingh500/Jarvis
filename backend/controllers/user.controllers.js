 import uploadOnCloudinary from "../config/cloudinary.js"
import geminiResponse from "../gemini.js"
import User from "../models/user.model.js"
import moment from "moment"
 export const getCurrentUser=async (req,res)=>{
    try {
        const userId=req.userId
        const user=await User.findById(userId).select("-password")
        if(!user){
return res.status(400).json({message:"user not found"})
        }

   return res.status(200).json(user)     
    } catch (error) {
       return res.status(400).json({message:"get current user error"}) 
    }
}

export const updateAssistant=async (req,res)=>{
   try {
      const {assistantName,imageUrl}=req.body
      let assistantImage;
if(req.file){
   assistantImage=await uploadOnCloudinary(req.file.path)
}else{
   assistantImage=imageUrl
}

const user=await User.findByIdAndUpdate(req.userId,{
   assistantName,assistantImage
},{new:true}).select("-password")
return res.status(200).json(user)

      
   } catch (error) {
       return res.status(400).json({message:"updateAssistantError user error"}) 
   }
}


export const askToAssistant=async (req,res)=>{
   try {
      const {command}=req.body
      const user=await User.findById(req.userId);
      if (user) {
         user.history.push(command)
         await user.save()
      }
      const userName=user?.name || "User"
      const assistantName=user?.assistantName || "Assistant"
      const result=await geminiResponse(command,assistantName,userName)

      let gemResult = null;
      if (result) {
         try {
            const jsonMatch=result.match(/{[\s\S]*}/)
            if (jsonMatch) {
               gemResult=JSON.parse(jsonMatch[0])
            }
         } catch (e) {
            console.error("Failed to parse assistant response:", e);
         }
      }

      if (!gemResult) {
         return res.status(200).json({
            type: "general",
            userInput: command,
            response: "Sorry, I had trouble processing that. Could you please repeat?"
         })
      }

      console.log("Assistant interpreted:", gemResult)
      const type=gemResult.type

      switch(type){
         case 'get-date' :
            return res.json({
               type,
               userInput:gemResult.userInput,
               response:`Current date is ${moment().format("YYYY-MM-DD")}`
            });
         case 'get-time':
            return res.json({
               type,
               userInput:gemResult.userInput,
               response:`Current time is ${moment().format("hh:mm A")}`
            });
         case 'get-day':
            return res.json({
               type,
               userInput:gemResult.userInput,
               response:`Today is ${moment().format("dddd")}`
            });
         case 'get-month':
            return res.json({
               type,
               userInput:gemResult.userInput,
               response:`Current month is ${moment().format("MMMM")}`
            });
         case 'google-search':
         case 'youtube-search':
         case 'youtube-play':
         case 'general':
         case "calculator-open":
         case "instagram-open": 
         case "facebook-open": 
         case "weather-show":
            return res.json({
               type,
               userInput:gemResult.userInput,
               response:gemResult.response,
            });

         default:
            return res.json({
               type: "general",
               userInput: command,
               response: gemResult.response || "I didn't understand that command."
            })
      }

   } catch (error) {
      console.error("askToAssistant controller error:", error);
      return res.status(200).json({
         type: "general",
         userInput: req.body?.command || "",
         response: "Sorry, I encountered an internal error. Please try again."
      })
   }
}