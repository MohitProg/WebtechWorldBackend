class ApiError extends Error{
  constructor(statuscode,message="something went wrong",errors=[],stack=""){
    super(message)
    this.statuscode=statuscode,
    this.message=message,
    this.success=false,
    this.errors=errors

    if(stack){
      this.stack=stack
    }else{
      Error.captureStackTrace(this,this.constructor)
    }

  }
}


export const errorHandler=(err,req,res,next)=>{
  return res.status(err.statuscode||500).json({
    success:false,
    message:err.message||"internal server error",
    errors:err.errors||[]
   
  })

}

export {ApiError};